export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  in_transit_orders: number;
  delivered_orders: number;
  total_drivers: number;
  available_drivers: number;
  total_vehicles: number;
  available_vehicles: number;
  total_partners: number;
  pending_partner_requests: number;
  total_depots: number;
  total_charging_ports: number;
  available_charging_ports: number;
}

export interface DriverDashboardStats {
  total_deliveries: number;
  today_deliveries: number;
  this_month_deliveries: number;
  pending_orders: number;
  in_transit_orders: number;
  daily_kpi_target: number;
  kpi_completed_today: boolean;
  average_rating: number;
}
