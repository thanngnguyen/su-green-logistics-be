import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';
import {
  CreateGreenZoneDto,
  UpdateGreenZoneDto,
  CreateBufferZoneDto,
  UpdateBufferZoneDto,
} from '../../common/dto';
import { GreenZone, BufferZone } from '../../common/interfaces';
import { PaginationParams, PaginatedResponse } from '../../common/interfaces';

@Injectable()
export class GreenZonesService {
  constructor(private supabaseService: SupabaseService) {}

  // Green Zones
  async findAllGreenZones(
    params?: PaginationParams & { is_active?: boolean },
  ): Promise<PaginatedResponse<GreenZone>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (params?.is_active !== undefined) filter.is_active = params.is_active;

    const [zones, total] = await Promise.all([
      this.supabaseService.findAll<GreenZone>('green_zones', {
        filter,
        orderBy: {
          column: params?.sortBy || 'name',
          ascending: params?.sortOrder !== 'desc',
        },
        limit,
        offset,
      }),
      this.supabaseService.count('green_zones', filter),
    ]);

    return {
      data: zones,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneGreenZone(id: string): Promise<GreenZone> {
    const zone = await this.supabaseService.findOne<GreenZone>(
      'green_zones',
      id,
    );
    if (!zone) {
      throw new NotFoundException('Green zone not found');
    }
    return zone;
  }

  async createGreenZone(createDto: CreateGreenZoneDto): Promise<GreenZone> {
    return this.supabaseService.create<GreenZone>('green_zones', {
      ...createDto,
      is_active: true,
    });
  }

  async updateGreenZone(
    id: string,
    updateDto: UpdateGreenZoneDto,
  ): Promise<GreenZone> {
    return this.supabaseService.update<GreenZone>('green_zones', id, updateDto);
  }

  async deleteGreenZone(id: string): Promise<void> {
    await this.supabaseService.delete('green_zones', id);
  }

  async getActiveGreenZones(): Promise<GreenZone[]> {
    return this.supabaseService.findAll<GreenZone>('green_zones', {
      filter: { is_active: true },
    });
  }

  // Buffer Zones
  async findAllBufferZones(
    params?: PaginationParams & { green_zone_id?: string; is_active?: boolean },
  ): Promise<PaginatedResponse<BufferZone>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (params?.green_zone_id) filter.green_zone_id = params.green_zone_id;
    if (params?.is_active !== undefined) filter.is_active = params.is_active;

    const [zones, total] = await Promise.all([
      this.supabaseService.findAll<BufferZone>('buffer_zones', {
        select: '*, green_zone:green_zones(*)',
        filter,
        orderBy: {
          column: params?.sortBy || 'name',
          ascending: params?.sortOrder !== 'desc',
        },
        limit,
        offset,
      }),
      this.supabaseService.count('buffer_zones', filter),
    ]);

    return {
      data: zones,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneBufferZone(id: string): Promise<BufferZone> {
    const zone = await this.supabaseService.findOne<BufferZone>(
      'buffer_zones',
      id,
      '*, green_zone:green_zones(*)',
    );
    if (!zone) {
      throw new NotFoundException('Buffer zone not found');
    }
    return zone;
  }

  async createBufferZone(createDto: CreateBufferZoneDto): Promise<BufferZone> {
    return this.supabaseService.create<BufferZone>('buffer_zones', {
      ...createDto,
      current_load: 0,
      is_active: true,
    });
  }

  async updateBufferZone(
    id: string,
    updateDto: UpdateBufferZoneDto,
  ): Promise<BufferZone> {
    return this.supabaseService.update<BufferZone>(
      'buffer_zones',
      id,
      updateDto,
    );
  }

  async deleteBufferZone(id: string): Promise<void> {
    await this.supabaseService.delete('buffer_zones', id);
  }

  async getBufferZonesByGreenZone(greenZoneId: string): Promise<BufferZone[]> {
    return this.supabaseService.findAll<BufferZone>('buffer_zones', {
      filter: { green_zone_id: greenZoneId, is_active: true },
    });
  }

  async updateBufferZoneLoad(
    id: string,
    loadChange: number,
  ): Promise<BufferZone> {
    const zone = await this.findOneBufferZone(id);
    const newLoad = Math.max(
      0,
      Math.min(zone.capacity, zone.current_load + loadChange),
    );
    return this.supabaseService.update<BufferZone>('buffer_zones', id, {
      current_load: newLoad,
    });
  }
}
