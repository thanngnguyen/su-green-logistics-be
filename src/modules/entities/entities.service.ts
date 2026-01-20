import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';
import { Driver } from '../../common/interfaces';
import { PaginationParams, PaginatedResponse } from '../../common/interfaces';

@Injectable()
export class DriversService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(
    params?: PaginationParams & { is_available?: boolean },
  ): Promise<PaginatedResponse<Driver>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (params?.is_available !== undefined)
      filter.is_available = params.is_available;

    const [drivers, total] = await Promise.all([
      this.supabaseService.findAll<Driver>('drivers', {
        select: '*, user:users(*)',
        filter,
        orderBy: {
          column: params?.sortBy || 'created_at',
          ascending: params?.sortOrder === 'asc',
        },
        limit,
        offset,
      }),
      this.supabaseService.count('drivers', filter),
    ]);

    return {
      data: drivers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Driver> {
    const driver = await this.supabaseService.findOne<Driver>(
      'drivers',
      id,
      '*, user:users(*)',
    );
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    return driver;
  }

  async findByUserId(userId: string): Promise<Driver | null> {
    const drivers = await this.supabaseService.findAll<Driver>('drivers', {
      filter: { user_id: userId },
      select: '*, user:users(*)',
    });
    return drivers[0] || null;
  }

  async create(data: Partial<Driver>): Promise<Driver> {
    return this.supabaseService.create<Driver>('drivers', data);
  }

  async update(id: string, data: Partial<Driver>): Promise<Driver> {
    return this.supabaseService.update<Driver>('drivers', id, data);
  }

  async delete(id: string): Promise<void> {
    await this.supabaseService.delete('drivers', id);
  }

  async updateLocation(id: string, lat: number, lng: number): Promise<Driver> {
    return this.supabaseService.update<Driver>('drivers', id, {
      current_lat: lat,
      current_lng: lng,
    });
  }

  async updateAvailability(id: string, isAvailable: boolean): Promise<Driver> {
    return this.supabaseService.update<Driver>('drivers', id, {
      is_available: isAvailable,
    });
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    return this.supabaseService.findAll<Driver>('drivers', {
      filter: { is_available: true },
      select: '*, user:users(*)',
    });
  }

  async findNearbyDrivers(
    lat: number,
    lng: number,
    radiusKm: number = 10,
  ): Promise<any[]> {
    return this.supabaseService.rpc('find_available_drivers', {
      p_lat: lat,
      p_lng: lng,
      p_radius_km: radiusKm,
    });
  }
}
