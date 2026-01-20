import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { OrderStatus } from '../enums';

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  partner_id?: string;

  @IsOptional()
  @IsString()
  buffer_zone_id?: string;

  @IsOptional()
  @IsString()
  green_zone_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  volume?: number;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  special_instructions?: string;

  @IsString()
  pickup_address: string;

  @IsOptional()
  @IsNumber()
  pickup_lat?: number;

  @IsOptional()
  @IsNumber()
  pickup_lng?: number;

  @IsString()
  delivery_address: string;

  @IsOptional()
  @IsNumber()
  delivery_lat?: number;

  @IsOptional()
  @IsNumber()
  delivery_lng?: number;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  driver_id?: string;

  @IsOptional()
  @IsString()
  vehicle_id?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  special_instructions?: string;

  @IsOptional()
  @IsNumber()
  current_lat?: number;

  @IsOptional()
  @IsNumber()
  current_lng?: number;
}

export class AssignDriverDto {
  @IsString()
  driver_id: string;

  @IsString()
  vehicle_id: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class TrackOrderDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}
