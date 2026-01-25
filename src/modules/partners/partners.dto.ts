import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';

export class CreatePartnerDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên công ty không được để trống' })
  company_name: string;

  @IsOptional()
  @IsString()
  tax_code?: string;

  @IsOptional()
  @IsString()
  business_license?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  contact_person?: string;

  @IsOptional()
  @IsString()
  contact_phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  contact_email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  partner_type?: string; // 'supplier' hoặc 'transporter'

  @IsOptional()
  @IsEnum(['active', 'inactive', 'negotiating'], {
    message: 'Trạng thái hợp đồng không hợp lệ',
  })
  contract_status?: string;

  @IsOptional()
  @IsDateString()
  contract_start_date?: string;

  @IsOptional()
  @IsDateString()
  contract_end_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePartnerDto {
  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsString()
  tax_code?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  contact_person?: string;

  @IsOptional()
  @IsString()
  contact_phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  contact_email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  partner_type?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'negotiating'], {
    message: 'Trạng thái hợp đồng không hợp lệ',
  })
  contract_status?: string;

  @IsOptional()
  @IsDateString()
  contract_start_date?: string;

  @IsOptional()
  @IsDateString()
  contract_end_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
