import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ReportType, ReportStatus } from '../enums';

export class CreateReportDto {
  @IsString()
  reporter_id: string;

  @IsEnum(ReportType)
  report_type: ReportType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsString()
  vehicle_id?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsArray()
  attachments?: string[];
}

export class UpdateReportDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsString()
  resolved_by?: string;

  @IsOptional()
  @IsString()
  priority?: string;
}
