import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';
import { CreatePricingDto, UpdatePricingDto } from '../../common/dto';
import { Pricing } from '../../common/interfaces';
import { PaginationParams, PaginatedResponse } from '../../common/interfaces';

@Injectable()
export class PricingService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(
    params?: PaginationParams & { is_active?: boolean },
  ): Promise<PaginatedResponse<Pricing>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (params?.is_active !== undefined) filter.is_active = params.is_active;

    const [pricings, total] = await Promise.all([
      this.supabaseService.findAll<Pricing>('pricing', {
        filter,
        orderBy: {
          column: params?.sortBy || 'name',
          ascending: params?.sortOrder !== 'desc',
        },
        limit,
        offset,
      }),
      this.supabaseService.count('pricing', filter),
    ]);

    return {
      data: pricings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Pricing> {
    const pricing = await this.supabaseService.findOne<Pricing>('pricing', id);
    if (!pricing) {
      throw new NotFoundException('Pricing not found');
    }
    return pricing;
  }

  async create(createDto: CreatePricingDto): Promise<Pricing> {
    const pricingData: Partial<Pricing> = {
      ...createDto,
      is_active: true,
      valid_from: createDto.valid_from
        ? new Date(createDto.valid_from)
        : undefined,
      valid_to: createDto.valid_to ? new Date(createDto.valid_to) : undefined,
    };
    return this.supabaseService.create<Pricing>('pricing', pricingData);
  }

  async update(id: string, updateDto: UpdatePricingDto): Promise<Pricing> {
    return this.supabaseService.update<Pricing>('pricing', id, updateDto);
  }

  async delete(id: string): Promise<void> {
    await this.supabaseService.delete('pricing', id);
  }

  async getActivePricings(): Promise<Pricing[]> {
    return this.supabaseService.findAll<Pricing>('pricing', {
      filter: { is_active: true },
    });
  }

  async calculatePrice(
    pricingId: string,
    distance: number,
    weight?: number,
    volume?: number,
  ): Promise<{
    base_price: number;
    distance_price: number;
    weight_price: number;
    total_price: number;
  }> {
    const result = await this.supabaseService.rpc('calculate_order_price', {
      p_distance: distance,
      p_weight: weight || 0,
      p_volume: volume || 0,
      p_pricing_id: pricingId,
    });

    if (result && Array.isArray(result) && result.length > 0) {
      return result[0];
    }

    const pricing = await this.findOne(pricingId);
    const base_price = pricing.base_price;
    const distance_price = distance * pricing.price_per_km;
    const weight_price = (weight || 0) * pricing.price_per_kg;
    const total_price =
      base_price + distance_price + weight_price + pricing.green_zone_surcharge;

    return { base_price, distance_price, weight_price, total_price };
  }
}
