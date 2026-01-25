import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  AssignVehicleDto,
} from '../../common/dto';
import { Vehicle } from '../../common/interfaces';
import { PaginationParams, PaginatedResponse } from '../../common/interfaces';

// Define user columns to select from users table
const USER_COLUMNS =
  'id, email, full_name, phone, avatar_url, role, address, created_at, updated_at';

@Injectable()
export class VehiclesService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(
    params?: PaginationParams & { status?: string; driver_id?: string },
  ): Promise<PaginatedResponse<Vehicle>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    const filter: Record<string, any> = {};
    // Only add filter if value exists and is not empty string
    if (params?.status && params.status !== 'undefined') {
      filter.status = params.status;
    }
    if (params?.driver_id && params.driver_id !== 'undefined') {
      filter.driver_id = params.driver_id;
    }

    const [vehicles, total] = await Promise.all([
      this.supabaseService.findAll<Vehicle>('vehicles', {
        select: `*, driver:drivers(*, user:users(${USER_COLUMNS}))`,
        filter,
        orderBy: {
          column: params?.sortBy || 'created_at',
          ascending: params?.sortOrder === 'asc',
        },
        limit,
        offset,
      }),
      this.supabaseService.count('vehicles', filter),
    ]);

    return {
      data: vehicles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.supabaseService.findOne<Vehicle>(
      'vehicles',
      id,
      `*, driver:drivers(*, user:users(${USER_COLUMNS}))`,
    );
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle;
  }

  async findByPlateNumber(plateNumber: string): Promise<Vehicle | null> {
    const vehicles = await this.supabaseService.findAll<Vehicle>('vehicles', {
      filter: { plate_number: plateNumber },
    });
    return vehicles[0] || null;
  }

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    const vehicleData: Partial<Vehicle> = {
      ...createVehicleDto,
      current_battery_level: 100,
      status: 'available',
      insurance_expiry: createVehicleDto.insurance_expiry
        ? new Date(createVehicleDto.insurance_expiry)
        : undefined,
      registration_expiry: createVehicleDto.registration_expiry
        ? new Date(createVehicleDto.registration_expiry)
        : undefined,
    };
    return this.supabaseService.create<Vehicle>('vehicles', vehicleData);
  }

  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    const updateData: Partial<Vehicle> = {
      ...updateVehicleDto,
      last_maintenance_date: updateVehicleDto.last_maintenance_date
        ? new Date(updateVehicleDto.last_maintenance_date)
        : undefined,
      next_maintenance_date: updateVehicleDto.next_maintenance_date
        ? new Date(updateVehicleDto.next_maintenance_date)
        : undefined,
    };
    return this.supabaseService.update<Vehicle>('vehicles', id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.supabaseService.delete('vehicles', id);
  }

  async assignToDriver(id: string, driverId: string): Promise<Vehicle> {
    return this.supabaseService.update<Vehicle>('vehicles', id, {
      driver_id: driverId,
    });
  }

  async unassignFromDriver(id: string): Promise<Vehicle> {
    return this.supabaseService.update<Vehicle>('vehicles', id, {
      driver_id: undefined,
    });
  }

  async updateStatus(
    id: string,
    status: 'available' | 'in_use' | 'charging' | 'maintenance' | 'inactive',
  ): Promise<Vehicle> {
    return this.supabaseService.update<Vehicle>('vehicles', id, { status });
  }

  async updateBatteryLevel(id: string, batteryLevel: number): Promise<Vehicle> {
    return this.supabaseService.update<Vehicle>('vehicles', id, {
      current_battery_level: batteryLevel,
    });
  }

  async getAvailableVehicles(): Promise<Vehicle[]> {
    return this.supabaseService.findAll<Vehicle>('vehicles', {
      filter: { status: 'available' },
      select: `*, driver:drivers(*, user:users(${USER_COLUMNS}))`,
    });
  }

  async getVehiclesNeedingMaintenance(): Promise<Vehicle[]> {
    // Get vehicles with maintenance due
    const allVehicles = await this.supabaseService.findAll<Vehicle>(
      'vehicles',
      {
        select: '*',
      },
    );

    const today = new Date();
    return allVehicles.filter((vehicle) => {
      if (vehicle.next_maintenance_date) {
        return new Date(vehicle.next_maintenance_date) <= today;
      }
      return false;
    });
  }

  async getVehicleByDriver(driverId: string): Promise<Vehicle | null> {
    const vehicles = await this.supabaseService.findAll<Vehicle>('vehicles', {
      filter: { driver_id: driverId },
    });
    return vehicles[0] || null;
  }
}
