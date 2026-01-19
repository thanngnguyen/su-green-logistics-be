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
      supplier_id?: string;
      driver_id?: string;
      from_date?: string;
      to_date?: string;
    },
  ): Promise<PaginatedResponse<Order>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (params?.status) filter.status = params.status;
    if (params?.supplier_id) filter.supplier_id = params.supplier_id;
    if (params?.driver_id) filter.driver_id = params.driver_id;

    const [orders, total] = await Promise.all([
      this.supabaseService.findAll<Order>('orders', {
        select:
          '*, supplier:suppliers(*), driver:drivers(*), store:stores(*), vehicle:vehicles(*)',
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
      '*, supplier:suppliers(*), driver:drivers(*), store:stores(*), vehicle:vehicles(*)',
    );
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async findByCode(orderCode: string): Promise<Order> {
    const orders = await this.supabaseService.findAll<Order>('orders', {
      filter: { order_code: orderCode },
      select:
        '*, supplier:suppliers(*), driver:drivers(*), store:stores(*), vehicle:vehicles(*)',
    });
    if (orders.length === 0) {
      throw new NotFoundException('Order not found');
    }
    return orders[0];
  }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // Calculate price if pricing_id is provided
    let priceData = {};
    if (createOrderDto.pricing_id) {
      const calculatedPrice = await this.supabaseService.rpc<any>(
        'calculate_order_price',
        {
          p_distance: 10, // Will be calculated based on coordinates
          p_weight: createOrderDto.weight || 0,
          p_volume: createOrderDto.volume || 0,
          p_pricing_id: createOrderDto.pricing_id,
        },
      );
      if (calculatedPrice && calculatedPrice.length > 0) {
        priceData = calculatedPrice[0];
      }
    }

    return this.supabaseService.create<Order>('orders', {
      ...createOrderDto,
      ...priceData,
      status: 'pending',
      payment_status: 'pending',
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

  async getOrdersBySupplier(
    supplierId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Order>> {
    return this.findAll({ ...params, supplier_id: supplierId });
  }

  async getOrdersByDriver(
    driverId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Order>> {
    return this.findAll({ ...params, driver_id: driverId });
  }

  async getPendingOrders(): Promise<Order[]> {
    return this.supabaseService.findAll<Order>('orders', {
      filter: { status: 'pending' },
      select: '*, supplier:suppliers(*), store:stores(*)',
      orderBy: { column: 'created_at', ascending: true },
    });
  }
}
