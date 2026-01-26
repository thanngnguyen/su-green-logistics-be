import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';
import {
  CreateOrderDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
  AssignDriverDto,
  AssignMultipleDriversDto,
  DriverAcceptOrderDto,
  CompleteOrderDto,
} from '../../common/dto';
import { Order, OrderTracking, OrderAssignment } from '../../common/interfaces';
import { PaginationParams, PaginatedResponse } from '../../common/interfaces';

@Injectable()
export class OrdersService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(
    params?: PaginationParams & {
      status?: string;
      partner_id?: string;
      driver_id?: string;
      from_date?: string;
      to_date?: string;
    },
  ): Promise<PaginatedResponse<Order>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    const filter: Record<string, any> = {};
    // Only add filter if value exists, is not empty string, and is not 'undefined'
    if (
      params?.status &&
      params.status !== '' &&
      params.status !== 'undefined'
    ) {
      filter.status = params.status;
    }
    if (
      params?.partner_id &&
      params.partner_id !== '' &&
      params.partner_id !== 'undefined'
    ) {
      filter.partner_id = params.partner_id;
    }
    if (
      params?.driver_id &&
      params.driver_id !== '' &&
      params.driver_id !== 'undefined'
    ) {
      filter.driver_id = params.driver_id;
    }

    const [orders, total] = await Promise.all([
      this.supabaseService.findAll<Order>('orders', {
        select:
          '*, partner:partners(*), driver:drivers(*), vehicle:vehicles(*)',
        filter,
        orderBy: {
          column: params?.sortBy || 'created_at',
          ascending: params?.sortOrder === 'asc',
        },
        limit,
        offset,
      }),
      this.supabaseService.count('orders', filter),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.supabaseService.findOne<Order>(
      'orders',
      id,
      '*, partner:partners(*), driver:drivers(*, user:users(*)), vehicle:vehicles(*)',
    );
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Lấy danh sách assignments cho đơn hàng
    const supabase = this.supabaseService.getAdminClient();
    const { data: assignments } = await supabase
      .from('order_assignments')
      .select('*, driver:drivers(*, user:users(*))')
      .eq('order_id', id)
      .order('assigned_at', { ascending: false });

    return {
      ...order,
      assignments: assignments || [],
    };
  }

  async findByCode(orderCode: string): Promise<Order> {
    const orders = await this.supabaseService.findAll<Order>('orders', {
      filter: { order_code: orderCode },
      select: '*, partner:partners(*), driver:drivers(*), vehicle:vehicles(*)',
    });
    if (orders.length === 0) {
      throw new NotFoundException('Order not found');
    }
    return orders[0];
  }

  async create(
    createOrderDto: CreateOrderDto,
    createdBy?: string,
  ): Promise<Order> {
    return this.supabaseService.create<Order>('orders', {
      ...createOrderDto,
      status: 'pending',
      created_by: createdBy,
    });
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    return this.supabaseService.update<Order>('orders', id, updateOrderDto);
  }

  async delete(id: string): Promise<void> {
    await this.supabaseService.delete('orders', id);
  }

  async assignDriver(
    id: string,
    assignDriverDto: AssignDriverDto,
  ): Promise<Order> {
    // Lấy vehicle_id từ driver nếu không được cung cấp
    let vehicleId = assignDriverDto.vehicle_id;

    if (!vehicleId && assignDriverDto.driver_id) {
      // Tìm xe được gán cho tài xế này
      const vehicles = await this.supabaseService.findAll<any>('vehicles', {
        filter: { driver_id: assignDriverDto.driver_id },
        select: 'id',
        limit: 1,
      });

      if (vehicles.length > 0) {
        vehicleId = vehicles[0].id;
      }
    }

    return this.supabaseService.update<Order>('orders', id, {
      driver_id: assignDriverDto.driver_id,
      vehicle_id: vehicleId || undefined,
      status: 'confirmed',
    });
  }

  /**
   * Phân công đơn hàng cho nhiều tài xế
   * Mỗi tài xế sẽ nhận được thông báo và có thể nhận/từ chối đơn
   */
  async assignMultipleDrivers(
    orderId: string,
    dto: AssignMultipleDriversDto,
  ): Promise<{ order: Order; assignments: OrderAssignment[] }> {
    // Kiểm tra đơn hàng tồn tại và đang ở trạng thái pending
    const order = await this.findOne(orderId);
    if (order.status !== 'pending') {
      throw new BadRequestException(
        'Chỉ có thể phân công đơn hàng đang chờ xử lý',
      );
    }

    if (dto.driver_ids.length === 0) {
      throw new BadRequestException('Phải chọn ít nhất một tài xế');
    }

    // Xóa các phân công cũ (nếu có)
    const supabase = this.supabaseService.getAdminClient();
    await supabase.from('order_assignments').delete().eq('order_id', orderId);

    // Tạo phân công mới cho từng tài xế
    const assignments: OrderAssignment[] = [];
    for (const driverId of dto.driver_ids) {
      const { data, error } = await supabase
        .from('order_assignments')
        .insert({
          order_id: orderId,
          driver_id: driverId,
          status: 'pending',
          assigned_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating assignment:', error);
        continue;
      }
      assignments.push(data);

      // TODO: Gửi thông báo cho tài xế (email + push notification)
      await this.notifyDriverAssignment(driverId, order);
    }

    return { order, assignments };
  }

  /**
   * Gửi thông báo cho tài xế về đơn hàng mới được phân công
   */
  private async notifyDriverAssignment(
    driverId: string,
    order: Order,
  ): Promise<void> {
    try {
      // Lấy thông tin tài xế
      const driver = await this.supabaseService.findOne<any>(
        'drivers',
        driverId,
        '*, user:users(*)',
      );
      if (!driver?.user?.email) return;

      // Tạo notification trong database
      const supabase = this.supabaseService.getAdminClient();
      await supabase.from('notifications').insert({
        user_id: driver.user_id,
        title: 'Đơn hàng mới',
        message: `Bạn được phân công đơn hàng ${order.order_code}. Vui lòng xác nhận nhận đơn.`,
        type: 'order_assignment',
        data: { order_id: order.id, order_code: order.order_code },
        is_read: false,
      });

      // TODO: Gửi email notification
      // await this.emailService.sendOrderAssignmentEmail(driver.user.email, order);
    } catch (error) {
      console.error('Error notifying driver:', error);
    }
  }

  /**
   * Lấy danh sách đơn hàng được phân công cho tài xế (chờ xác nhận)
   * Trả về danh sách orders (không phải assignments) để frontend dễ xử lý
   */
  async getAssignedOrders(driverId: string): Promise<Order[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('order_assignments')
      .select(
        `
        *,
        order:orders(*, partner:partners(*))
      `,
      )
      .eq('driver_id', driverId)
      .eq('status', 'pending')
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching assigned orders:', error);
      return [];
    }

    // Trả về danh sách orders từ assignments
    return (data || []).map((assignment: any) => ({
      ...assignment.order,
      assignment_id: assignment.id,
      assigned_at: assignment.assigned_at,
    }));
  }

  /**
   * Tài xế nhận hoặc từ chối đơn hàng
   */
  async driverRespondToOrder(
    orderId: string,
    driverId: string,
    dto: DriverAcceptOrderDto,
  ): Promise<{ success: boolean; message: string; order?: Order }> {
    const supabase = this.supabaseService.getAdminClient();

    // Kiểm tra phân công tồn tại
    const { data: assignment, error: assignmentError } = await supabase
      .from('order_assignments')
      .select('*')
      .eq('order_id', orderId)
      .eq('driver_id', driverId)
      .single();

    if (assignmentError || !assignment) {
      throw new NotFoundException('Không tìm thấy phân công đơn hàng này');
    }

    if (assignment.status !== 'pending') {
      throw new BadRequestException('Bạn đã phản hồi đơn hàng này rồi');
    }

    // Kiểm tra đơn hàng chưa được nhận bởi tài xế khác
    const order = await this.findOne(orderId);
    if (order.status !== 'pending' && order.driver_id) {
      throw new BadRequestException(
        'Đơn hàng này đã được nhận bởi tài xế khác',
      );
    }

    if (dto.accept) {
      // Tài xế nhận đơn
      // Lấy vehicle_id từ driver
      const vehicles = await this.supabaseService.findAll<any>('vehicles', {
        filter: { driver_id: driverId },
        select: 'id',
        limit: 1,
      });
      const vehicleId = vehicles.length > 0 ? vehicles[0].id : null;

      // Cập nhật đơn hàng
      const updatedOrder = await this.supabaseService.update<Order>(
        'orders',
        orderId,
        {
          driver_id: driverId,
          vehicle_id: vehicleId,
          status: 'in_transit', // Chuyển sang trạng thái đang giao
        },
      );

      // Cập nhật trạng thái phân công
      await supabase
        .from('order_assignments')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', assignment.id);

      // Cập nhật các phân công khác thành rejected (vì đơn đã được nhận)
      await supabase
        .from('order_assignments')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
          reject_reason: 'Đơn hàng đã được nhận bởi tài xế khác',
        })
        .eq('order_id', orderId)
        .neq('driver_id', driverId)
        .eq('status', 'pending');

      // Thêm tracking record
      await this.supabaseService.rpc('add_order_tracking', {
        p_order_id: orderId,
        p_status: 'in_transit',
        p_note: 'Tài xế đã nhận đơn và bắt đầu giao hàng',
      });

      return {
        success: true,
        message: 'Nhận đơn hàng thành công! Bắt đầu giao hàng.',
        order: updatedOrder,
      };
    } else {
      // Tài xế từ chối đơn
      await supabase
        .from('order_assignments')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
          reject_reason: dto.reject_reason || 'Tài xế từ chối',
        })
        .eq('id', assignment.id);

      return {
        success: true,
        message: 'Đã từ chối đơn hàng',
      };
    }
  }

  /**
   * Tài xế hoàn thành đơn hàng (check-in giao hàng xong)
   */
  async completeOrder(
    orderId: string,
    driverId: string,
    dto: CompleteOrderDto,
  ): Promise<Order> {
    // Kiểm tra đơn hàng thuộc về tài xế này và đang ở trạng thái in_transit
    const order = await this.findOne(orderId);

    if (order.driver_id !== driverId) {
      throw new BadRequestException('Đơn hàng này không thuộc về bạn');
    }

    if (order.status !== 'in_transit') {
      throw new BadRequestException('Chỉ có thể hoàn thành đơn hàng đang giao');
    }

    // Gọi function check-in để cập nhật KPI
    await this.driverCheckin(orderId, driverId, 'delivery', {
      photo_url: dto.photo_url,
      signature: dto.signature,
      receiver_name: dto.receiver_name,
      note: dto.note,
      lat: dto.lat,
      lng: dto.lng,
    });

    // Cập nhật đơn hàng thành delivered
    const updatedOrder = await this.supabaseService.update<Order>(
      'orders',
      orderId,
      {
        status: 'delivered',
        actual_delivery_time: new Date(),
        current_lat: dto.lat,
        current_lng: dto.lng,
      },
    );

    // Thêm tracking record
    await this.supabaseService.rpc('add_order_tracking', {
      p_order_id: orderId,
      p_status: 'delivered',
      p_lat: dto.lat,
      p_lng: dto.lng,
      p_note: dto.note || 'Giao hàng thành công',
    });

    return updatedOrder;
  }

  /**
   * Lấy các đơn hàng đang giao của tài xế (status = in_transit)
   */
  async getActiveOrders(driverId: string): Promise<Order[]> {
    return this.supabaseService.findAll<Order>('orders', {
      filter: { driver_id: driverId, status: 'in_transit' },
      select: '*, partner:partners(*)',
      orderBy: { column: 'created_at', ascending: false },
    });
  }

  /**
   * Lấy lịch sử đơn hàng đã hoàn thành của tài xế
   */
  async getCompletedOrders(
    driverId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Order>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    const filter = { driver_id: driverId, status: 'delivered' };

    const [orders, total] = await Promise.all([
      this.supabaseService.findAll<Order>('orders', {
        filter,
        select: '*, partner:partners(*)',
        orderBy: { column: 'actual_delivery_time', ascending: false },
        limit,
        offset,
      }),
      this.supabaseService.count('orders', filter),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    // Add tracking record
    await this.supabaseService.rpc('add_order_tracking', {
      p_order_id: id,
      p_status: updateStatusDto.status,
      p_lat: updateStatusDto.lat,
      p_lng: updateStatusDto.lng,
      p_note: updateStatusDto.note,
    });

    // Update order status
    const updateData: Partial<Order> = {
      status: updateStatusDto.status,
    };

    if (updateStatusDto.lat && updateStatusDto.lng) {
      updateData.current_lat = updateStatusDto.lat;
      updateData.current_lng = updateStatusDto.lng;
    }

    if (updateStatusDto.status === 'in_transit') {
      updateData.actual_pickup_time = new Date();
    } else if (updateStatusDto.status === 'delivered') {
      updateData.actual_delivery_time = new Date();
    }

    return this.supabaseService.update<Order>('orders', id, updateData);
  }

  async getTracking(orderId: string): Promise<OrderTracking[]> {
    return this.supabaseService.findAll<OrderTracking>('order_tracking', {
      filter: { order_id: orderId },
      orderBy: { column: 'created_at', ascending: true },
    });
  }

  async getOrdersByDriver(
    driverId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Order>> {
    return this.findAll({ ...params, driver_id: driverId });
  }

  async getOrdersByPartner(
    partnerId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Order>> {
    return this.findAll({ ...params, partner_id: partnerId });
  }

  async getPendingOrders(): Promise<Order[]> {
    return this.supabaseService.findAll<Order>('orders', {
      filter: { status: 'pending' },
      select: '*, partner:partners(*)',
      orderBy: { column: 'created_at', ascending: true },
    });
  }

  /**
   * Tài xế check-in khi lấy hàng hoặc giao hàng xong
   */
  async driverCheckin(
    orderId: string,
    driverId: string,
    checkinType: 'pickup' | 'delivery',
    checkinData: {
      photo_url?: string;
      signature?: string;
      receiver_name?: string;
      note?: string;
      lat?: number;
      lng?: number;
    },
  ): Promise<any> {
    // Gọi function trong database để xử lý check-in và cập nhật KPI
    const result = await this.supabaseService.rpc<any>(
      'driver_delivery_checkin',
      {
        p_order_id: orderId,
        p_driver_id: driverId,
        p_checkin_type: checkinType,
        p_photo_url: checkinData.photo_url || null,
        p_signature: checkinData.signature || null,
        p_receiver_name: checkinData.receiver_name || null,
        p_note: checkinData.note || null,
        p_lat: checkinData.lat || null,
        p_lng: checkinData.lng || null,
      },
    );

    return result;
  }

  /**
   * Lấy thống kê KPI của một tài xế
   */
  async getDriverKpi(driverId: string): Promise<any> {
    const result = await this.supabaseService.rpc<any>(
      'get_driver_dashboard_stats',
      { p_driver_id: driverId },
    );

    return result && result.length > 0 ? result[0] : null;
  }

  /**
   * Admin xem thống kê KPI của tất cả tài xế
   */
  async getDriversKpiSummary(date?: string): Promise<any[]> {
    const result = await this.supabaseService.rpc<any[]>(
      'get_drivers_kpi_summary',
      { p_date: date || new Date().toISOString().split('T')[0] },
    );

    return result || [];
  }
}
