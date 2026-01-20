import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  IsEnum,
} from 'class-validator';

// =============================================
// DEPOT DTOs (BẾN XE)
// =============================================

export class CreateDepotDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  address: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsString()
  manager_name?: string;

  @IsOptional()
  @IsString()
  manager_phone?: string;

  @IsOptional()
  @IsNumber()
  total_parking_slots?: number;

  @IsOptional()
  @IsNumber()
  total_charging_ports?: number;

  @IsOptional()
  @IsObject()
  operating_hours?: object;
}

export class UpdateDepotDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  manager_name?: string;

  @IsOptional()
  @IsString()
  manager_phone?: string;

  @IsOptional()
  @IsNumber()
  total_parking_slots?: number;

  @IsOptional()
  @IsNumber()
  total_charging_ports?: number;

  @IsOptional()
  @IsObject()
  operating_hours?: object;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// =============================================
// CHARGING PORT DTOs (TRỤ SẠC)
// =============================================

export enum ChargingPortStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  OFFLINE = 'offline',
}

export class CreateChargingPortDto {
  @IsString()
  depot_id: string;

  @IsNumber()
  port_number: number;

  @IsOptional()
  @IsString()
  port_code?: string;

  @IsOptional()
  @IsNumber()
  charger_power?: number;

  @IsOptional()
  @IsString()
  charger_type?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateChargingPortDto {
  @IsOptional()
  @IsNumber()
  port_number?: number;

  @IsOptional()
  @IsString()
  port_code?: string;

  @IsOptional()
  @IsNumber()
  charger_power?: number;

  @IsOptional()
  @IsString()
  charger_type?: string;

  @IsOptional()
  @IsEnum(ChargingPortStatus)
  status?: ChargingPortStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// =============================================
// CHARGING SESSION DTOs (PHIÊN SẠC)
// =============================================

export class StartChargingSessionDto {
  @IsString()
  vehicle_id: string;

  @IsString()
  depot_id: string;

  @IsString()
  charging_port_id: string;

  @IsOptional()
  @IsNumber()
  start_battery_level?: number;
}

export class EndChargingSessionDto {
  @IsOptional()
  @IsNumber()
  end_battery_level?: number;

  @IsOptional()
  @IsNumber()
  energy_consumed?: number;
}
