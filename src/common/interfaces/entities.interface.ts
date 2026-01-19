export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface User extends BaseEntity {
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: 'admin' | 'supplier' | 'driver';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  address?: string;
}

export interface Supplier extends BaseEntity {
  user_id: string;
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

export interface ChargingStation extends BaseEntity {
  name: string;
  address: string;
  lat: number;
  lng: number;
  total_chargers: number;
  available_chargers: number;
  charger_power?: number;
  price_per_kwh?: number;
  status: 'available' | 'occupied' | 'maintenance' | 'offline';
  operating_hours?: any;
  amenities?: any;
  green_zone_id?: string;
  is_active: boolean;
}

export interface Store extends BaseEntity {
  name: string;
  owner_name?: string;
  phone?: string;
  email?: string;
  address: string;
  lat?: number;
  lng?: number;
  green_zone_id?: string;
  operating_hours?: any;
  delivery_instructions?: string;
  is_active: boolean;
}

export interface Pricing extends BaseEntity {
  name: string;
  description?: string;
  base_price: number;
  price_per_km: number;
  price_per_kg: number;
  price_per_m3: number;
  min_distance: number;
  max_distance?: number;
  min_weight: number;
  max_weight?: number;
  surge_multiplier: number;
  green_zone_surcharge: number;
  is_active: boolean;
  valid_from?: Date;
  valid_to?: Date;
}

export interface Order extends BaseEntity {
  order_code: string;
  supplier_id: string;
  driver_id?: string;
  vehicle_id?: string;
  store_id: string;
  buffer_zone_id?: string;
  green_zone_id?: string;
  pricing_id?: string;
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
  base_price?: number;
  distance_price?: number;
  weight_price?: number;
  surge_price?: number;
  green_zone_fee?: number;
  total_price?: number;
  status:
    | 'pending'
    | 'confirmed'
    | 'pickup_ready'
    | 'in_transit'
    | 'delivered'
    | 'cancelled';
  payment_status: string;
  current_lat?: number;
  current_lng?: number;
  tracking_history?: any;
  pickup_signature?: string;
  delivery_signature?: string;
  pickup_photo_url?: string;
  delivery_photo_url?: string;
  supplier?: Supplier;
  driver?: Driver;
  vehicle?: Vehicle;
  store?: Store;
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
  charging_station_id: string;
  start_time: Date;
  end_time?: Date;
  start_battery_level?: number;
  end_battery_level?: number;
  energy_consumed?: number;
  total_cost?: number;
  status: string;
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

export interface Revenue extends BaseEntity {
  order_id: string;
  supplier_id: string;
  driver_id?: string;
  amount: number;
  platform_fee?: number;
  driver_earning?: number;
  payment_method?: string;
  payment_reference?: string;
  status: string;
  paid_at?: Date;
}

export interface Notification extends BaseEntity {
  user_id: string;
  title: string;
  message?: string;
  type?: string;
  data?: any;
  is_read: boolean;
}
