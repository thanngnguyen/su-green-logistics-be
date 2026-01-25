import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';
import {
  CreateOrderDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
  AssignDriverDto,
} from '../../common/dto';
import { Order, OrderTracking } from '../../common/interfaces';
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
      '*, partner:partners(*), driver:drivers(*), vehicle:vehicles(*)',
    );
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
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
    return this.supabaseService.update<Order>('orders', id, {
      driver_id: assignDriverDto.driver_id,
      vehicle_id: assignDriverDto.vehicle_id,
      status: 'confirmed',
    });
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
