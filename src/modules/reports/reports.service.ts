import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';
import { CreateReportDto, UpdateReportDto } from '../../common/dto';
import { Report } from '../../common/interfaces';
import { PaginationParams, PaginatedResponse } from '../../common/interfaces';

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
    if (params?.status) filter.status = params.status;
    if (params?.report_type) filter.report_type = params.report_type;
    if (params?.reporter_id) filter.reporter_id = params.reporter_id;
    if (params?.priority) filter.priority = params.priority;

    const [reports, total] = await Promise.all([
      this.supabaseService.findAll<Report>('reports', {
        select: '*, reporter:users(*), order:orders(*), vehicle:vehicles(*)',
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
      '*, reporter:users(*), order:orders(*), vehicle:vehicles(*)',
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
      select: '*, reporter:users(*), order:orders(*), vehicle:vehicles(*)',
      orderBy: { column: 'created_at', ascending: true },
    });
  }

  async getUrgentReports(): Promise<Report[]> {
    return this.supabaseService.findAll<Report>('reports', {
      filter: { priority: 'urgent', status: 'pending' },
      select: '*, reporter:users(*), order:orders(*), vehicle:vehicles(*)',
      orderBy: { column: 'created_at', ascending: true },
    });
  }
}
