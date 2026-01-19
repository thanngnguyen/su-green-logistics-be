// CHỈ CÓ 2 ROLES: ADMIN VÀ DRIVER
export enum UserRole {
  ADMIN = 'admin',
  DRIVER = 'driver',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export enum VehicleStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  CHARGING = 'charging',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PICKUP_READY = 'pickup_ready',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum ChargingStationStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  OFFLINE = 'offline',
}

export enum ReportType {
  VEHICLE_ISSUE = 'vehicle_issue',
  ORDER_ISSUE = 'order_issue',
  ACCIDENT = 'accident',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

// Partner Request Status
export enum PartnerRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CONTACTED = 'contacted',
}

// Partner Contract Status
export enum PartnerContractStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  NEGOTIATING = 'negotiating',
}
