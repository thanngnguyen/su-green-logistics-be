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

  @IsOptional()
  @IsString()
  vehicle_id?: string; // Tùy chọn - nếu không có sẽ tự động lấy từ driver
}

// DTO mới cho phân công nhiều tài xế
export class AssignMultipleDriversDto {
  @IsArray()
  @IsString({ each: true })
  driver_ids: string[]; // Danh sách ID tài xế được phân công
}

// DTO cho tài xế nhận/từ chối đơn hàng
export class DriverAcceptOrderDto {
  @IsBoolean()
  accept: boolean; // true = nhận, false = từ chối

  @IsOptional()
  @IsString()
  reject_reason?: string; // Lý do từ chối (nếu từ chối)
}

// DTO cho tài xế hoàn thành đơn hàng
export class CompleteOrderDto {
  @IsOptional()
  @IsString()
  photo_url?: string; // Ảnh xác nhận giao hàng

  @IsOptional()
  @IsString()
  signature?: string; // Chữ ký người nhận

  @IsOptional()
  @IsString()
  receiver_name?: string; // Tên người nhận

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
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
