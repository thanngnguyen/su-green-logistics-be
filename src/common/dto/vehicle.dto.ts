import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { VehicleStatus } from '../enums';

export class CreateVehicleDto {
  @IsString()
  plate_number: string;

  @IsOptional()
  @IsString()
  driver_id?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsNumber()
  battery_capacity?: number;

  @IsOptional()
  @IsNumber()
  range_per_charge?: number;

  @IsOptional()
  @IsNumber()
  max_load_weight?: number;

  @IsOptional()
  @IsNumber()
  max_load_volume?: number;

  @IsOptional()
  @IsDateString()
  insurance_expiry?: string;

  @IsOptional()
  @IsDateString()
  registration_expiry?: string;
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  driver_id?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  current_battery_level?: number;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @IsOptional()
  @IsDateString()
  last_maintenance_date?: string;

  @IsOptional()
  @IsDateString()
  next_maintenance_date?: string;
}

export class AssignVehicleDto {
  @IsString()
  driver_id: string;
}
