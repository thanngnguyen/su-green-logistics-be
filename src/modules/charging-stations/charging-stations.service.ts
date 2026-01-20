import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';
import { Depot, ChargingPort, ChargingSession } from '../../common/interfaces';
import { PaginationParams, PaginatedResponse } from '../../common/interfaces';

@Injectable()
export class DepotsService {
  constructor(private supabaseService: SupabaseService) {}

  // =============================================
  // DEPOTS (BẾN XE)
  // =============================================

  async findAllDepots(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Depot>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    const [depots, total] = await Promise.all([
      this.supabaseService.findAll<Depot>('depots', {
        filter: { is_active: true },
        orderBy: {
          column: params?.sortBy || 'name',
          ascending: params?.sortOrder !== 'desc',
        },
        limit,
        offset,
      }),
      this.supabaseService.count('depots', { is_active: true }),
    ]);

    return {
      data: depots,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findDepotById(id: string): Promise<Depot> {
    const depot = await this.supabaseService.findOne<Depot>('depots', id);
    if (!depot) {
      throw new NotFoundException('Bến xe không tồn tại');
    }
    return depot;
  }

  async createDepot(data: Partial<Depot>): Promise<Depot> {
    return this.supabaseService.create<Depot>('depots', {
      ...data,
      is_active: true,
    });
  }

  async updateDepot(id: string, data: Partial<Depot>): Promise<Depot> {
    return this.supabaseService.update<Depot>('depots', id, data);
  }

  async deleteDepot(id: string): Promise<void> {
    await this.supabaseService.delete('depots', id);
  }

  // =============================================
  // CHARGING PORTS (TRỤ SẠC)
  // =============================================

  async findPortsByDepot(depotId: string): Promise<ChargingPort[]> {
    return this.supabaseService.findAll<ChargingPort>('charging_ports', {
      filter: { depot_id: depotId, is_active: true },
      orderBy: { column: 'port_number', ascending: true },
    });
  }

  async findAvailablePorts(depotId: string): Promise<ChargingPort[]> {
    return this.supabaseService.findAll<ChargingPort>('charging_ports', {
      filter: { depot_id: depotId, status: 'available', is_active: true },
      orderBy: { column: 'port_number', ascending: true },
    });
  }

  async findPortById(id: string): Promise<ChargingPort> {
    const port = await this.supabaseService.findOne<ChargingPort>(
      'charging_ports',
      id,
    );
    if (!port) {
      throw new NotFoundException('Trụ sạc không tồn tại');
    }
    return port;
  }

  async createPort(data: Partial<ChargingPort>): Promise<ChargingPort> {
    return this.supabaseService.create<ChargingPort>('charging_ports', {
      ...data,
      status: 'available',
      is_active: true,
    });
  }

  async updatePort(
    id: string,
    data: Partial<ChargingPort>,
  ): Promise<ChargingPort> {
    return this.supabaseService.update<ChargingPort>(
      'charging_ports',
      id,
      data,
    );
  }

  async deletePort(id: string): Promise<void> {
    await this.supabaseService.delete('charging_ports', id);
  }

  // =============================================
  // CHARGING SESSIONS (PHIÊN SẠC)
  // =============================================

  async startChargingSession(data: {
    vehicle_id: string;
    driver_id: string;
    depot_id: string;
    charging_port_id: string;
    start_battery_level?: number;
  }): Promise<ChargingSession> {
    // Kiểm tra trụ sạc có đang trống không
    const port = await this.findPortById(data.charging_port_id);
    if (port.status !== 'available') {
      throw new BadRequestException(
        `Trụ sạc số ${port.port_number} đang không khả dụng`,
      );
    }

    // Tạo phiên sạc
    const session = await this.supabaseService.create<ChargingSession>(
      'charging_sessions',
      {
        ...data,
        port_number: port.port_number,
        start_time: new Date(),
        status: 'in_progress',
      },
    );

    // Cập nhật trạng thái trụ sạc
    await this.supabaseService.update<ChargingPort>(
      'charging_ports',
      data.charging_port_id,
      {
        status: 'in_use',
        current_vehicle_id: data.vehicle_id,
      },
    );

    // Cập nhật trạng thái xe
    await this.supabaseService.update('vehicles', data.vehicle_id, {
      status: 'charging',
    });

    return session;
  }

  async endChargingSession(
    sessionId: string,
    data: {
      end_battery_level?: number;
      energy_consumed?: number;
    },
  ): Promise<ChargingSession> {
    const session = await this.supabaseService.findOne<ChargingSession>(
      'charging_sessions',
      sessionId,
    );
    if (!session) {
      throw new NotFoundException('Phiên sạc không tồn tại');
    }

    // Cập nhật phiên sạc
    const updatedSession = await this.supabaseService.update<ChargingSession>(
      'charging_sessions',
      sessionId,
      {
        end_time: new Date(),
        end_battery_level: data.end_battery_level,
        energy_consumed: data.energy_consumed,
        status: 'completed',
      },
    );

    // Giải phóng trụ sạc
    await this.supabaseService.update<ChargingPort>(
      'charging_ports',
      session.charging_port_id,
      {
        status: 'available',
        current_vehicle_id: undefined,
      },
    );

    // Cập nhật trạng thái xe
    await this.supabaseService.update('vehicles', session.vehicle_id, {
      status: 'available',
      current_battery_level: data.end_battery_level,
    });

    return updatedSession;
  }

  async getChargingSessions(params?: {
    vehicle_id?: string;
    driver_id?: string;
    depot_id?: string;
    port_id?: string;
  }): Promise<ChargingSession[]> {
    const filter: Record<string, any> = {};
    if (params?.vehicle_id) filter.vehicle_id = params.vehicle_id;
    if (params?.driver_id) filter.driver_id = params.driver_id;
    if (params?.depot_id) filter.depot_id = params.depot_id;
    if (params?.port_id) filter.charging_port_id = params.port_id;

    return this.supabaseService.findAll<ChargingSession>('charging_sessions', {
      filter,
      orderBy: { column: 'start_time', ascending: false },
    });
  }

  async getActiveSession(driverId: string): Promise<ChargingSession | null> {
    const sessions = await this.supabaseService.findAll<ChargingSession>(
      'charging_sessions',
      {
        filter: { driver_id: driverId, status: 'in_progress' },
      },
    );
    return sessions[0] || null;
  }

  // =============================================
  // DASHBOARD - Thống kê trụ sạc theo bến
  // =============================================

  async getDepotChargingStats(depotId: string): Promise<{
    depot: Depot;
    total_ports: number;
    available_ports: number;
    in_use_ports: number;
    maintenance_ports: number;
    offline_ports: number;
    ports: ChargingPort[];
  }> {
    const depot = await this.findDepotById(depotId);
    const ports = await this.findPortsByDepot(depotId);

    const stats = {
      depot,
      total_ports: ports.length,
      available_ports: ports.filter((p) => p.status === 'available').length,
      in_use_ports: ports.filter((p) => p.status === 'in_use').length,
      maintenance_ports: ports.filter((p) => p.status === 'maintenance').length,
      offline_ports: ports.filter((p) => p.status === 'offline').length,
      ports,
    };

    return stats;
  }
}
