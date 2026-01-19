import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';
import { Supplier, Driver, Store } from '../../common/interfaces';
import { PaginationParams, PaginatedResponse } from '../../common/interfaces';

@Injectable()
export class SuppliersService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Supplier>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    const [suppliers, total] = await Promise.all([
      this.supabaseService.findAll<Supplier>('suppliers', {
        select: '*, user:users(*)',
        orderBy: {
          column: params?.sortBy || 'created_at',
          ascending: params?.sortOrder === 'asc',
        },
        limit,
        offset,
      }),
      this.supabaseService.count('suppliers'),
    ]);

    return {
      data: suppliers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.supabaseService.findOne<Supplier>(
      'suppliers',
      id,
      '*, user:users(*)',
    );
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
    return supplier;
  }

  async findByUserId(userId: string): Promise<Supplier | null> {
    const suppliers = await this.supabaseService.findAll<Supplier>(
      'suppliers',
      {
        filter: { user_id: userId },
        select: '*, user:users(*)',
      },
    );
    return suppliers[0] || null;
  }

  async create(data: Partial<Supplier>): Promise<Supplier> {
    return this.supabaseService.create<Supplier>('suppliers', data);
  }

  async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
    return this.supabaseService.update<Supplier>('suppliers', id, data);
  }

  async delete(id: string): Promise<void> {
    await this.supabaseService.delete('suppliers', id);
  }
}

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

@Injectable()
export class StoresService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(
    params?: PaginationParams & { green_zone_id?: string },
  ): Promise<PaginatedResponse<Store>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (params?.green_zone_id) filter.green_zone_id = params.green_zone_id;

    const [stores, total] = await Promise.all([
      this.supabaseService.findAll<Store>('stores', {
        filter,
        orderBy: {
          column: params?.sortBy || 'name',
          ascending: params?.sortOrder !== 'desc',
        },
        limit,
        offset,
      }),
      this.supabaseService.count('stores', filter),
    ]);

    return {
      data: stores,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Store> {
    const store = await this.supabaseService.findOne<Store>('stores', id);
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  async create(data: Partial<Store>): Promise<Store> {
    return this.supabaseService.create<Store>('stores', {
      ...data,
      is_active: true,
    });
  }

  async update(id: string, data: Partial<Store>): Promise<Store> {
    return this.supabaseService.update<Store>('stores', id, data);
  }

  async delete(id: string): Promise<void> {
    await this.supabaseService.delete('stores', id);
  }
}
