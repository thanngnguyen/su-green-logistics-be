export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface User extends BaseEntity {
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: 'admin' | 'partner' | 'driver';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  address?: string;
}

export interface Partner extends BaseEntity {
  user_id?: string;
  company_name: string;
  business_license?: string;
  tax_code?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  buffer_zone_address?: string;
  buffer_zone_lat?: number;
  buffer_zone_lng?: number;
  status: 'active' | 'inactive' | 'pending';
  user?: User;
}

export interface Driver extends BaseEntity {
  user_id: string;
  license_number: string;
  license_expiry: Date;
  id_card_number: string;
  date_of_birth?: Date;
  emergency_contact?: string;
  emergency_phone?: string;
  rating: number;
  total_deliveries: number;
  is_available: boolean;
  current_lat?: number;
  current_lng?: number;
  user?: User;
}

export interface Vehicle extends BaseEntity {
  driver_id?: string;
  plate_number: string;
  brand?: string;
  model?: string;
  year?: number;
  battery_capacity?: number;
  current_battery_level: number;
  range_per_charge?: number;
  max_load_weight?: number;
  max_load_volume?: number;
  status: 'available' | 'in_use' | 'charging' | 'maintenance' | 'inactive';
  last_maintenance_date?: Date;
  next_maintenance_date?: Date;
  insurance_expiry?: Date;
  registration_expiry?: Date;
  driver?: Driver;
}

export interface GreenZone extends BaseEntity {
  name: string;
  description?: string;
  zone_type: string;
  polygon_coordinates?: any;
  center_lat?: number;
  center_lng?: number;
  radius?: number;
  is_active: boolean;
  operating_hours?: any;
  restrictions?: any;
}

export interface BufferZone extends BaseEntity {
  green_zone_id?: string;
  name: string;
  description?: string;
  address?: string;
  lat: number;
  lng: number;
  capacity: number;
  current_load: number;
  operating_hours?: any;
  is_active: boolean;
  green_zone?: GreenZone;
}

export interface Depot extends BaseEntity {
  name: string;
  code?: string;
  address: string;
  lat: number;
  lng: number;
  manager_name?: string;
  manager_phone?: string;
  total_parking_slots: number;
  total_charging_ports: number;
  operating_hours?: any;
  is_active: boolean;
}

export interface ChargingPort extends BaseEntity {
  depot_id: string;
  port_number: number;
  port_code?: string;
  charger_power: number;
  charger_type: string;
  status: 'available' | 'in_use' | 'maintenance' | 'offline';
  current_vehicle_id?: string;
  last_maintenance_date?: Date;
  notes?: string;
  is_active: boolean;
  depot?: Depot;
}

export interface Order extends BaseEntity {
  order_code: string;
  partner_id?: string;
  driver_id?: string;
  vehicle_id?: string;
  buffer_zone_id?: string;
  green_zone_id?: string;
  description?: string;
  weight?: number;
  volume?: number;
  quantity: number;
  special_instructions?: string;
  pickup_address: string;
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_address: string;
  delivery_lat?: number;
  delivery_lng?: number;
  estimated_pickup_time?: Date;
  actual_pickup_time?: Date;
  estimated_delivery_time?: Date;
  actual_delivery_time?: Date;
  distance?: number;
  status:
    | 'pending'
    | 'confirmed'
    | 'pickup_ready'
    | 'in_transit'
    | 'delivered'
    | 'cancelled';
  current_lat?: number;
  current_lng?: number;
  tracking_history?: any;
  pickup_signature?: string;
  delivery_signature?: string;
  pickup_photo_url?: string;
  delivery_photo_url?: string;
  created_by?: string;
  partner?: Partner;
  driver?: Driver;
  vehicle?: Vehicle;
  assignments?: OrderAssignment[];
}

export interface OrderAssignment extends BaseEntity {
  order_id: string;
  driver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  assigned_at: Date;
  responded_at?: Date;
  reject_reason?: string;
  driver?: Driver;
  order?: Order;
}

export interface OrderTracking extends BaseEntity {
  order_id: string;
  status: string;
  lat?: number;
  lng?: number;
  note?: string;
}

export interface ChargingSession extends BaseEntity {
  vehicle_id: string;
  driver_id: string;
  depot_id: string;
  charging_port_id: string;
  port_number?: number;
  start_time: Date;
  end_time?: Date;
  start_battery_level?: number;
  end_battery_level?: number;
  energy_consumed?: number;
  status: string;
  depot?: Depot;
  charging_port?: ChargingPort;
}

export interface Report extends BaseEntity {
  reporter_id: string;
  report_type: 'vehicle_issue' | 'order_issue' | 'accident' | 'other';
  title: string;
  description?: string;
  order_id?: string;
  vehicle_id?: string;
  priority: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  resolution?: string;
  resolved_by?: string;
  resolved_at?: Date;
  attachments?: any;
}

export interface Notification extends BaseEntity {
  user_id: string;
  title: string;
  message?: string;
  type?: string;
  data?: any;
  is_read: boolean;
}
