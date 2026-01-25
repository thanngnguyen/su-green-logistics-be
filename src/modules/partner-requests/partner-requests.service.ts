import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';
import {
  CreatePartnerRequestDto,
  UpdatePartnerRequestDto,
} from './partner-requests.dto';

export interface PartnerRequest {
  id: string;
  company_name: string;
  tax_code?: string;
  category?: string;
  description?: string;
  contact_name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  partner_type: string;
  cooperation_reason?: string;
  expected_volume?: string;
  status: string;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class PartnerRequestsService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Tạo đăng ký hợp tác mới (Public API - không cần auth)
   */
  async create(
    createDto: CreatePartnerRequestDto,
  ): Promise<{ message: string; request_id: string }> {
    const request = await this.supabaseService.create<PartnerRequest>(
      'partner_requests',
      {
        company_name: createDto.company_name,
        tax_code: createDto.tax_code,
        category: createDto.category,
        description: createDto.description,
        contact_name: createDto.contact_name,
        email: createDto.email,
        phone: createDto.phone,
        address: createDto.address,
        city: createDto.city,
        partner_type: createDto.partner_type || 'supplier',
        cooperation_reason: createDto.cooperation_reason,
        expected_volume: createDto.expected_volume,
        status: 'pending',
      },
    );

    return {
      message:
        'Đăng ký hợp tác đã được gửi thành công. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.',
      request_id: request.id,
    };
  }

  /**
   * Lấy danh sách đăng ký hợp tác (Admin only)
   */
  async findAll(options?: {
    status?: string;
    partner_type?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: PartnerRequest[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const filter: Record<string, any> = {};

    // Only add filter if value exists, is not empty string, and is not 'undefined'
    if (
      options?.status &&
      options.status !== '' &&
      options.status !== 'undefined' &&
      options.status !== 'all'
    ) {
      filter.status = options.status;
    }
    if (
      options?.partner_type &&
      options.partner_type !== '' &&
      options.partner_type !== 'undefined'
    ) {
      filter.partner_type = options.partner_type;
    }

    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const offset = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.supabaseService.findAll<PartnerRequest>('partner_requests', {
        filter,
        orderBy: { column: 'created_at', ascending: false },
        limit,
        offset,
      }),
      this.supabaseService.count('partner_requests', filter),
    ]);

    return {
      data: requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy chi tiết đăng ký hợp tác (Admin only)
   */
  async findOne(id: string): Promise<PartnerRequest> {
    const request = await this.supabaseService.findOne<PartnerRequest>(
      'partner_requests',
      id,
    );

    if (!request) {
      throw new NotFoundException('Không tìm thấy đăng ký hợp tác');
    }

    return request;
  }

  /**
   * Cập nhật trạng thái đăng ký (Admin only)
   */
  async update(
    id: string,
    updateDto: UpdatePartnerRequestDto,
    adminId: string,
  ): Promise<PartnerRequest> {
    const updateData: Partial<PartnerRequest> = {};

    if (updateDto.status) {
      updateData.status = updateDto.status;
      updateData.reviewed_by = adminId;
      updateData.reviewed_at = new Date().toISOString();
    }

    if (updateDto.admin_notes !== undefined) {
      updateData.admin_notes = updateDto.admin_notes;
    }

    const updated = await this.supabaseService.update<PartnerRequest>(
      'partner_requests',
      id,
      updateData,
    );

    return updated;
  }

  /**
   * Xóa đăng ký hợp tác (Admin only)
   */
  async remove(id: string): Promise<{ message: string }> {
    await this.supabaseService.delete('partner_requests', id);
    return { message: 'Đã xóa đăng ký hợp tác' };
  }

  /**
   * Đếm số đăng ký đang chờ xử lý
   */
  async countPending(): Promise<number> {
    const requests = await this.supabaseService.findAll<PartnerRequest>(
      'partner_requests',
      {
        filter: { status: 'pending' },
      },
    );
    return requests.length;
  }
}
