import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  IsEnum,
} from 'class-validator';
import { ChargingStationStatus } from '../enums';

export class CreateChargingStationDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsNumber()
  total_chargers?: number;

  @IsOptional()
  @IsNumber()
  charger_power?: number;

  @IsOptional()
  @IsNumber()
  price_per_kwh?: number;

  @IsOptional()
  @IsObject()
  operating_hours?: object;

  @IsOptional()
  @IsObject()
  amenities?: object;

  @IsOptional()
  @IsString()
  green_zone_id?: string;
}

export class UpdateChargingStationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  available_chargers?: number;

  @IsOptional()
  @IsEnum(ChargingStationStatus)
  status?: ChargingStationStatus;

  @IsOptional()
  @IsNumber()
  price_per_kwh?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class StartChargingSessionDto {
  @IsString()
  vehicle_id: string;

  @IsString()
  driver_id: string;

  @IsString()
  charging_station_id: string;

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

  @IsOptional()
  @IsNumber()
  total_cost?: number;
}
