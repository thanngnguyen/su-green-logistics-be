import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';

@Injectable()
export class DriversService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: string;
    is_available?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 10,
      status,
      is_available,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = params;

    const offset = (page - 1) * limit;
    const client = this.supabase.getClient();

    let query = client
      .from('drivers')
      .select('*, user:users(*)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (is_available !== undefined) {
      query = query.eq('is_available', is_available);
    }

    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(error.message);
    }

    return {
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async findOne(id: string) {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('drivers')
      .select('*, user:users(*), vehicle:vehicles(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Driver not found');
    }

    return data;
  }

  async create(createDriverDto: any) {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('drivers')
      .insert(createDriverDto)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async update(id: string, updateDriverDto: any) {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('drivers')
      .update(updateDriverDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async delete(id: string) {
    const client = this.supabase.getClient();

    const { error } = await client.from('drivers').delete().eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return { message: 'Driver deleted successfully' };
  }

  async getAvailableDrivers() {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('drivers')
      .select('*, user:users(*)')
      .eq('is_available', true)
      .eq('status', 'active');

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getNearbyDrivers(lat: number, lng: number, radius: number = 10) {
    const client = this.supabase.getClient();

    // Simple distance calculation using Haversine formula
    // For production, use PostGIS or a proper geospatial query
    const { data, error } = await client
      .from('drivers')
      .select('*, user:users(*)')
      .eq('is_available', true)
      .eq('status', 'active')
      .not('current_lat', 'is', null)
      .not('current_lng', 'is', null);

    if (error) {
      throw new Error(error.message);
    }

    // Filter by radius in km
    const nearbyDrivers = data?.filter((driver) => {
      const distance = this.calculateDistance(
        lat,
        lng,
        driver.current_lat,
        driver.current_lng,
      );
      return distance <= radius;
    });

    return nearbyDrivers || [];
  }

  async updateLocation(id: string, lat: number, lng: number) {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('drivers')
      .update({
        current_lat: lat,
        current_lng: lng,
        last_location_update: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async updateAvailability(id: string, isAvailable: boolean) {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('drivers')
      .update({ is_available: isAvailable })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Haversine formula to calculate distance between two points
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
