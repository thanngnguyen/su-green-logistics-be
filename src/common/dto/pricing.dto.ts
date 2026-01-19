import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreatePricingDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  base_price: number;

  @IsNumber()
  price_per_km: number;

  @IsOptional()
  @IsNumber()
  price_per_kg?: number;

  @IsOptional()
  @IsNumber()
  price_per_m3?: number;

  @IsOptional()
  @IsNumber()
  min_distance?: number;

  @IsOptional()
  @IsNumber()
  max_distance?: number;

  @IsOptional()
  @IsNumber()
  surge_multiplier?: number;

  @IsOptional()
  @IsNumber()
  green_zone_surcharge?: number;

  @IsOptional()
  @IsDateString()
  valid_from?: string;

  @IsOptional()
  @IsDateString()
  valid_to?: string;
}

export class UpdatePricingDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  base_price?: number;

  @IsOptional()
  @IsNumber()
  price_per_km?: number;

  @IsOptional()
  @IsNumber()
  surge_multiplier?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
