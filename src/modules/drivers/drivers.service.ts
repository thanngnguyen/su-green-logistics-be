import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';

// Define user columns to select from users table
const USER_COLUMNS =
  'id, email, full_name, phone, avatar_url, role, address, created_at, updated_at';

@Injectable()
export class DriversService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    is_available?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 10,
      is_available,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = params;

    const offset = (page - 1) * limit;
    const client = this.supabase.getAdminClient();

    let query = client
      .from('drivers')
      .select(`*, user:users(${USER_COLUMNS})`, { count: 'exact' });

    // Only filter by is_available if explicitly set (not undefined)
    if (is_available !== undefined && is_available !== null) {
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
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async findOne(id: string) {
    const client = this.supabase.getAdminClient();

    const { data, error } = await client
      .from('drivers')
      .select(`*, user:users(${USER_COLUMNS}), vehicle:vehicles(*)`)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Driver not found');
    }

    return data;
  }

  async create(createDriverDto: any) {
    const adminClient = this.supabase.getAdminClient();

    // Nếu có email, tức là cần tạo user trước
    if (createDriverDto.email) {
      // Tạo password tạm thời
      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

      // Tạo user trong Supabase Auth
      const { data: authData, error: authError } =
        await adminClient.auth.admin.createUser({
          email: createDriverDto.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: createDriverDto.full_name,
            phone: createDriverDto.phone,
            role: 'driver',
          },
        });

      if (authError) {
        console.error('Supabase Auth Error (Driver):', authError);
        throw new BadRequestException(
          authError.message || 'Không thể tạo tài khoản tài xế',
        );
      }

      if (!authData?.user) {
        throw new BadRequestException('Không thể tạo tài khoản tài xế');
      }

      // Tự tạo user profile thay vì dựa vào trigger (tránh lỗi column status)
      const { error: userProfileError } = await adminClient
        .from('users')
        .upsert(
          {
            id: authData.user.id,
            email: createDriverDto.email, // Lưu email vào users table
            full_name: createDriverDto.full_name,
            phone: createDriverDto.phone || null,
            role: 'driver',
            address: createDriverDto.address || null,
          },
          { onConflict: 'id' },
        );

      if (userProfileError) {
        console.error('Error creating user profile:', userProfileError);
        // Xóa auth user nếu tạo profile thất bại
        await adminClient.auth.admin.deleteUser(authData.user.id);
        throw new BadRequestException('Không thể tạo hồ sơ người dùng');
      }

      // Chờ một chút để đảm bảo dữ liệu đã được ghi
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Tạo driver profile với user_id
      const driverData = {
        user_id: authData.user.id,
        license_number: createDriverDto.license_number || 'PENDING',
        license_expiry:
          createDriverDto.license_expiry ||
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        id_card_number: createDriverDto.id_card_number || 'PENDING',
        date_of_birth: createDriverDto.date_of_birth || null,
        emergency_contact: createDriverDto.emergency_contact || null,
        emergency_phone: createDriverDto.emergency_phone || null,
        is_available: true,
      };

      const { data, error } = await adminClient
        .from('drivers')
        .insert(driverData)
        .select(`*, user:users(${USER_COLUMNS})`)
        .single();

      if (error) {
        console.error('Error creating driver profile:', error);
        // Nếu tạo driver thất bại, xóa user đã tạo
        await adminClient.auth.admin.deleteUser(authData.user.id);
        throw new BadRequestException(error.message);
      }

      return {
        ...data,
        temporary_password: tempPassword,
        message:
          'Tài xế đã được tạo thành công. Mật khẩu tạm thời: ' + tempPassword,
      };
    }

    // Nếu có user_id, tạo driver profile trực tiếp
    const { data, error } = await adminClient
      .from('drivers')
      .insert(createDriverDto)
      .select(`*, user:users(${USER_COLUMNS})`)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async update(id: string, updateDriverDto: any) {
    const client = this.supabase.getAdminClient();

    const { data, error } = await client
      .from('drivers')
      .update(updateDriverDto)
      .eq('id', id)
      .select(`*, user:users(${USER_COLUMNS})`)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async delete(id: string) {
    const client = this.supabase.getAdminClient();

    const { error } = await client.from('drivers').delete().eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return { message: 'Driver deleted successfully' };
  }

  async getAvailableDrivers() {
    const client = this.supabase.getAdminClient();

    const { data, error } = await client
      .from('drivers')
      .select(`*, user:users(${USER_COLUMNS})`)
      .eq('is_available', true);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getNearbyDrivers(lat: number, lng: number, radius: number = 10) {
    const client = this.supabase.getAdminClient();

    // Simple distance calculation using Haversine formula
    // For production, use PostGIS or a proper geospatial query
    const { data, error } = await client
      .from('drivers')
      .select(`*, user:users(${USER_COLUMNS})`)
      .eq('is_available', true)
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
    const client = this.supabase.getAdminClient();

    const { data, error } = await client
      .from('drivers')
      .update({
        current_lat: lat,
        current_lng: lng,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`*, user:users(${USER_COLUMNS})`)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async updateAvailability(id: string, isAvailable: boolean) {
    const client = this.supabase.getAdminClient();

    const { data, error } = await client
      .from('drivers')
      .update({ is_available: isAvailable })
      .eq('id', id)
      .select(`*, user:users(${USER_COLUMNS})`)
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
