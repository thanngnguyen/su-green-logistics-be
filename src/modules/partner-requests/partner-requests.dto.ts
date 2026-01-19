import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';

export class CreatePartnerRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên công ty không được để trống' })
  company_name: string;

  @IsOptional()
  @IsString()
  tax_code?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên người liên hệ không được để trống' })
  contact_name: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  phone: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  partner_type?: string; // 'supplier' hoặc 'driver'

  @IsOptional()
  @IsString()
  cooperation_reason?: string;

  @IsOptional()
  @IsString()
  expected_volume?: string; // 'small', 'medium', 'large', 'enterprise'
}

export class UpdatePartnerRequestDto {
  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected', 'contacted'], {
    message: 'Trạng thái không hợp lệ',
  })
  status?: string;

  @IsOptional()
  @IsString()
  admin_notes?: string;
}
