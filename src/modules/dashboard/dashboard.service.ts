import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';
import { DashboardStats, DriverDashboardStats } from '../../common/interfaces';
import { Notification } from '../../common/interfaces';

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
      total_partners: 0,
      pending_partner_requests: 0,
      total_depots: 0,
      total_charging_ports: 0,
      available_charging_ports: 0,
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
      this_month_deliveries: 0,
      pending_orders: 0,
      in_transit_orders: 0,
      daily_kpi_target: 3,
      kpi_completed_today: false,
      average_rating: 5.0,
    };
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
