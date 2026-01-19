import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';
import {
  DashboardStats,
  SupplierDashboardStats,
  DriverDashboardStats,
} from '../../common/interfaces';
import { Revenue, Notification } from '../../common/interfaces';

@Injectable()
export class DashboardService {
  constructor(private supabaseService: SupabaseService) {}

  async getAdminDashboardStats(): Promise<DashboardStats> {
    const result = await this.supabaseService.rpc<DashboardStats[]>(
      'get_admin_dashboard_stats',
      {},
    );
    if (result && Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    return {
      total_orders: 0,
      pending_orders: 0,
      in_transit_orders: 0,
      delivered_orders: 0,
      total_drivers: 0,
      available_drivers: 0,
      total_vehicles: 0,
      available_vehicles: 0,
      total_suppliers: 0,
      total_revenue: 0,
      today_revenue: 0,
      this_month_revenue: 0,
    };
  }

  async getSupplierDashboardStats(
    supplierId: string,
  ): Promise<SupplierDashboardStats> {
    const result = await this.supabaseService.rpc<SupplierDashboardStats[]>(
      'get_supplier_dashboard_stats',
      {
        p_supplier_id: supplierId,
      },
    );
    if (result && Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    return {
      total_orders: 0,
      pending_orders: 0,
      in_transit_orders: 0,
      delivered_orders: 0,
      total_spent: 0,
      this_month_orders: 0,
      this_month_spent: 0,
    };
  }

  async getDriverDashboardStats(
    driverId: string,
  ): Promise<DriverDashboardStats> {
    const result = await this.supabaseService.rpc<DriverDashboardStats[]>(
      'get_driver_dashboard_stats',
      {
        p_driver_id: driverId,
      },
    );
    if (result && Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    return {
      total_deliveries: 0,
      today_deliveries: 0,
      pending_orders: 0,
      in_transit_orders: 0,
      total_earnings: 0,
      today_earnings: 0,
      this_month_earnings: 0,
      average_rating: 5.0,
    };
  }

  async getRevenueReport(params?: {
    from_date?: string;
    to_date?: string;
    group_by?: 'day' | 'week' | 'month';
  }): Promise<any[]> {
    const revenues = await this.supabaseService.findAll<Revenue>('revenue', {
      filter: { status: 'paid' },
      orderBy: { column: 'paid_at', ascending: true },
    });

    // Group revenue by date
    const grouped: Record<string, number> = {};
    revenues.forEach((rev) => {
      if (rev.paid_at) {
        const date = new Date(rev.paid_at);
        let key: string;
        switch (params?.group_by) {
          case 'week':
            const week = Math.ceil(date.getDate() / 7);
            key = `${date.getFullYear()}-W${week}`;
            break;
          case 'month':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          default:
            key = date.toISOString().split('T')[0];
        }
        grouped[key] = (grouped[key] || 0) + rev.amount;
      }
    });

    return Object.entries(grouped).map(([date, amount]) => ({ date, amount }));
  }

  async getOrdersReport(params?: {
    from_date?: string;
    to_date?: string;
    status?: string;
  }): Promise<any> {
    const filter: Record<string, any> = {};
    if (params?.status) filter.status = params.status;

    const orders = await this.supabaseService.findAll<any>('orders', {
      filter,
    });

    const statusCounts = orders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total: orders.length,
      by_status: statusCounts,
    };
  }

  // Notifications
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.supabaseService.findAll<Notification>('notifications', {
      filter: { user_id: userId },
      orderBy: { column: 'created_at', ascending: false },
      limit: 50,
    });
  }

  async createNotification(data: Partial<Notification>): Promise<Notification> {
    return this.supabaseService.create<Notification>('notifications', {
      ...data,
      is_read: false,
    });
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    return this.supabaseService.update<Notification>('notifications', id, {
      is_read: true,
    });
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const notifications = await this.supabaseService.findAll<Notification>(
      'notifications',
      {
        filter: { user_id: userId, is_read: false },
      },
    );

    await Promise.all(
      notifications.map((n) =>
        this.supabaseService.update('notifications', n.id, { is_read: true }),
      ),
    );
  }
}
