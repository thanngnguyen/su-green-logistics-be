import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class CreateGreenZoneDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  zone_type?: string;

  @IsOptional()
  @IsObject()
  polygon_coordinates?: object;

  @IsOptional()
  @IsNumber()
  center_lat?: number;

  @IsOptional()
  @IsNumber()
  center_lng?: number;

  @IsOptional()
  @IsNumber()
  radius?: number;

  @IsOptional()
  @IsObject()
  operating_hours?: object;

  @IsOptional()
  @IsObject()
  restrictions?: object;
}

export class UpdateGreenZoneDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  polygon_coordinates?: object;

  @IsOptional()
  @IsNumber()
  radius?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CreateBufferZoneDto {
  @IsOptional()
  @IsString()
  green_zone_id?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsObject()
  operating_hours?: object;
}

export class UpdateBufferZoneDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  current_load?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
