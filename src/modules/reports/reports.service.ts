import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';
import { CreateReportDto, UpdateReportDto } from '../../common/dto';
import { Report } from '../../common/interfaces';
import { PaginationParams, PaginatedResponse } from '../../common/interfaces';

// User columns to select from users table
const USER_COLUMNS =
  'id, email, full_name, phone, avatar_url, role, address, created_at, updated_at';

@Injectable()
export class ReportsService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(
    params?: PaginationParams & {
      status?: string;
      report_type?: string;
      reporter_id?: string;
      priority?: string;
    },
  ): Promise<PaginatedResponse<Report>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    const filter: Record<string, any> = {};
    // Only add filter if value exists, is not empty, and is not 'undefined' or 'all'
    if (
      params?.status &&
      params.status !== '' &&
      params.status !== 'undefined' &&
      params.status !== 'all'
    ) {
      filter.status = params.status;
    }
    if (
      params?.report_type &&
      params.report_type !== '' &&
      params.report_type !== 'undefined'
    ) {
      filter.report_type = params.report_type;
    }
    if (
      params?.reporter_id &&
      params.reporter_id !== '' &&
      params.reporter_id !== 'undefined'
    ) {
      filter.reporter_id = params.reporter_id;
    }
    if (
      params?.priority &&
      params.priority !== '' &&
      params.priority !== 'undefined'
    ) {
      filter.priority = params.priority;
    }

    const [reports, total] = await Promise.all([
      this.supabaseService.findAll<Report>('reports', {
        select: `*, reporter:users!reports_reporter_id_fkey(${USER_COLUMNS}), resolver:users!reports_resolved_by_fkey(${USER_COLUMNS}), order:orders(*), vehicle:vehicles(*)`,
        filter,
        orderBy: { column: params?.sortBy || 'created_at', ascending: false },
        limit,
        offset,
      }),
      this.supabaseService.count('reports', filter),
    ]);

    return {
      data: reports,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.supabaseService.findOne<Report>(
      'reports',
      id,
      `*, reporter:users!reports_reporter_id_fkey(${USER_COLUMNS}), resolver:users!reports_resolved_by_fkey(${USER_COLUMNS}), order:orders(*), vehicle:vehicles(*)`,
    );
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return report;
  }

  async create(createDto: CreateReportDto): Promise<Report> {
    return this.supabaseService.create<Report>('reports', {
      ...createDto,
      status: 'pending',
      priority: createDto.priority || 'medium',
    });
  }

  async update(id: string, updateDto: UpdateReportDto): Promise<Report> {
    const updateData: any = { ...updateDto };

    if (updateDto.status === 'resolved' && updateDto.resolved_by) {
      updateData.resolved_at = new Date();
    }

    return this.supabaseService.update<Report>('reports', id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.supabaseService.delete('reports', id);
  }

  async getReportsByReporter(reporterId: string): Promise<Report[]> {
    return this.supabaseService.findAll<Report>('reports', {
      filter: { reporter_id: reporterId },
      select: '*, order:orders(*), vehicle:vehicles(*)',
      orderBy: { column: 'created_at', ascending: false },
    });
  }

  async getPendingReports(): Promise<Report[]> {
    return this.supabaseService.findAll<Report>('reports', {
      filter: { status: 'pending' },
      select: `*, reporter:users!reports_reporter_id_fkey(${USER_COLUMNS}), resolver:users!reports_resolved_by_fkey(${USER_COLUMNS}), order:orders(*), vehicle:vehicles(*)`,
      orderBy: { column: 'created_at', ascending: true },
    });
  }

  async getUrgentReports(): Promise<Report[]> {
    return this.supabaseService.findAll<Report>('reports', {
      filter: { priority: 'urgent', status: 'pending' },
      select: `*, reporter:users!reports_reporter_id_fkey(${USER_COLUMNS}), resolver:users!reports_resolved_by_fkey(${USER_COLUMNS}), order:orders(*), vehicle:vehicles(*)`,
      orderBy: { column: 'created_at', ascending: true },
    });
  }
}
