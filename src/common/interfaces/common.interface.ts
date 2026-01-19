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
  total_suppliers: number;
  total_revenue: number;
  today_revenue: number;
  this_month_revenue: number;
}

export interface SupplierDashboardStats {
  total_orders: number;
  pending_orders: number;
  in_transit_orders: number;
  delivered_orders: number;
  total_spent: number;
  this_month_orders: number;
  this_month_spent: number;
}

export interface DriverDashboardStats {
  total_deliveries: number;
  today_deliveries: number;
  pending_orders: number;
  in_transit_orders: number;
  total_earnings: number;
  today_earnings: number;
  this_month_earnings: number;
  average_rating: number;
}
