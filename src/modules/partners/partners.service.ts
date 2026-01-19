import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';
import { CreatePartnerDto, UpdatePartnerDto } from './partners.dto';

export interface Partner {
  id: string;
  company_name: string;
  tax_code?: string;
  category?: string;
  description?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  city?: string;
  partner_type: string;
  contract_status: string;
  contract_start_date?: string;
  contract_end_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class PartnersService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Tạo đối tác mới (Admin only)
   */
  async create(createDto: CreatePartnerDto): Promise<Partner> {
    return this.supabaseService.create<Partner>('partners', {
      company_name: createDto.company_name,
      tax_code: createDto.tax_code,
      category: createDto.category,
      description: createDto.description,
      contact_person: createDto.contact_person,
      contact_phone: createDto.contact_phone,
      contact_email: createDto.contact_email,
      address: createDto.address,
      city: createDto.city,
      partner_type: createDto.partner_type || 'supplier',
      contract_status: createDto.contract_status || 'active',
      contract_start_date: createDto.contract_start_date,
      contract_end_date: createDto.contract_end_date,
      notes: createDto.notes,
    });
  }

  /**
   * Lấy danh sách đối tác (Admin only)
   */
  async findAll(options?: {
    contract_status?: string;
    partner_type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Partner[]; total: number }> {
    const filter: Record<string, any> = {};

    if (options?.contract_status) {
      filter.contract_status = options.contract_status;
    }
    if (options?.partner_type) {
      filter.partner_type = options.partner_type;
    }

    const limit = options?.limit;
    const offset =
      options?.page && limit ? (options.page - 1) * limit : undefined;

    const partners = await this.supabaseService.findAll<Partner>('partners', {
      filter,
      orderBy: { column: 'company_name', ascending: true },
      limit,
      offset,
    });

    return {
      data: partners,
      total: partners.length,
    };
  }

  /**
   * Lấy chi tiết đối tác (Admin only)
   */
  async findOne(id: string): Promise<Partner> {
    const partner = await this.supabaseService.findOne<Partner>('partners', id);

    if (!partner) {
      throw new NotFoundException('Không tìm thấy đối tác');
    }

    return partner;
  }

  /**
   * Cập nhật thông tin đối tác (Admin only)
   */
  async update(id: string, updateDto: UpdatePartnerDto): Promise<Partner> {
    const updated = await this.supabaseService.update<Partner>(
      'partners',
      id,
      updateDto,
    );
    return updated;
  }

  /**
   * Xóa đối tác (Admin only)
   */
  async remove(id: string): Promise<{ message: string }> {
    await this.supabaseService.delete('partners', id);
    return { message: 'Đã xóa đối tác' };
  }

  /**
   * Đếm số đối tác đang hoạt động
   */
  async countActive(): Promise<number> {
    const partners = await this.supabaseService.findAll<Partner>('partners', {
      filter: { contract_status: 'active' },
    });
    return partners.length;
  }
}
