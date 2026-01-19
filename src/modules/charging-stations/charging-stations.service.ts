import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';
import {
  CreateChargingStationDto,
  UpdateChargingStationDto,
  StartChargingSessionDto,
  EndChargingSessionDto,
} from '../../common/dto';
import { ChargingStation, ChargingSession } from '../../common/interfaces';
import { PaginationParams, PaginatedResponse } from '../../common/interfaces';

@Injectable()
export class ChargingStationsService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(
    params?: PaginationParams & { status?: string; green_zone_id?: string },
  ): Promise<PaginatedResponse<ChargingStation>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (params?.status) filter.status = params.status;
    if (params?.green_zone_id) filter.green_zone_id = params.green_zone_id;

    const [stations, total] = await Promise.all([
      this.supabaseService.findAll<ChargingStation>('charging_stations', {
        filter,
        orderBy: {
          column: params?.sortBy || 'name',
          ascending: params?.sortOrder !== 'desc',
        },
        limit,
        offset,
      }),
      this.supabaseService.count('charging_stations', filter),
    ]);

    return {
      data: stations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ChargingStation> {
    const station = await this.supabaseService.findOne<ChargingStation>(
      'charging_stations',
      id,
    );
    if (!station) {
      throw new NotFoundException('Charging station not found');
    }
    return station;
  }

  async create(createDto: CreateChargingStationDto): Promise<ChargingStation> {
    return this.supabaseService.create<ChargingStation>('charging_stations', {
      ...createDto,
      available_chargers: createDto.total_chargers || 1,
      status: 'available',
      is_active: true,
    });
  }

  async update(
    id: string,
    updateDto: UpdateChargingStationDto,
  ): Promise<ChargingStation> {
    return this.supabaseService.update<ChargingStation>(
      'charging_stations',
      id,
      updateDto,
    );
  }

  async delete(id: string): Promise<void> {
    await this.supabaseService.delete('charging_stations', id);
  }

  async findAvailable(
    lat: number,
    lng: number,
    radiusKm: number = 5,
  ): Promise<ChargingStation[]> {
    return this.supabaseService.rpc<ChargingStation[]>(
      'find_available_charging_stations',
      {
        p_lat: lat,
        p_lng: lng,
        p_radius_km: radiusKm,
      },
    );
  }

  async startChargingSession(
    dto: StartChargingSessionDto,
  ): Promise<ChargingSession> {
    // Create charging session
    const session = await this.supabaseService.create<ChargingSession>(
      'charging_sessions',
      {
        ...dto,
        start_time: new Date(),
        status: 'in_progress',
      },
    );

    // Update charging station available chargers
    const station = await this.findOne(dto.charging_station_id);
    await this.supabaseService.update<ChargingStation>(
      'charging_stations',
      dto.charging_station_id,
      {
        available_chargers: Math.max(0, station.available_chargers - 1),
        status: station.available_chargers <= 1 ? 'occupied' : 'available',
      },
    );

    // Update vehicle status
    await this.supabaseService.update('vehicles', dto.vehicle_id, {
      status: 'charging',
    });

    return session;
  }

  async endChargingSession(
    sessionId: string,
    dto: EndChargingSessionDto,
  ): Promise<ChargingSession> {
    const session = await this.supabaseService.findOne<ChargingSession>(
      'charging_sessions',
      sessionId,
    );
    if (!session) {
      throw new NotFoundException('Charging session not found');
    }

    // Update charging session
    const updatedSession = await this.supabaseService.update<ChargingSession>(
      'charging_sessions',
      sessionId,
      {
        end_time: new Date(),
        end_battery_level: dto.end_battery_level,
        energy_consumed: dto.energy_consumed,
        total_cost: dto.total_cost,
        status: 'completed',
      },
    );

    // Update charging station
    const station = await this.findOne(session.charging_station_id);
    await this.supabaseService.update<ChargingStation>(
      'charging_stations',
      session.charging_station_id,
      {
        available_chargers: station.available_chargers + 1,
        status: 'available',
      },
    );

    // Update vehicle
    await this.supabaseService.update('vehicles', session.vehicle_id, {
      status: 'available',
      current_battery_level: dto.end_battery_level,
    });

    return updatedSession;
  }

  async getChargingSessions(params?: {
    vehicle_id?: string;
    driver_id?: string;
    station_id?: string;
  }): Promise<ChargingSession[]> {
    const filter: Record<string, any> = {};
    if (params?.vehicle_id) filter.vehicle_id = params.vehicle_id;
    if (params?.driver_id) filter.driver_id = params.driver_id;
    if (params?.station_id) filter.charging_station_id = params.station_id;

    return this.supabaseService.findAll<ChargingSession>('charging_sessions', {
      filter,
      orderBy: { column: 'start_time', ascending: false },
    });
  }
}
