import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DepotsService } from './charging-stations.service';
import { AuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../common/enums';

// =============================================
// DEPOTS CONTROLLER (BẾN XE)
// =============================================

@Controller('depots')
@UseGuards(AuthGuard)
export class DepotsController {
  constructor(private readonly depotsService: DepotsService) {}

  @Get()
  async findAllDepots(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.depotsService.findAllDepots({
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  async findDepotById(@Param('id') id: string) {
    return this.depotsService.findDepotById(id);
  }

  @Get(':id/stats')
  async getDepotStats(@Param('id') id: string) {
    return this.depotsService.getDepotChargingStats(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createDepot(@Body() data: any) {
    return this.depotsService.createDepot(data);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateDepot(@Param('id') id: string, @Body() data: any) {
    return this.depotsService.updateDepot(id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteDepot(@Param('id') id: string) {
    return this.depotsService.deleteDepot(id);
  }

  // =============================================
  // CHARGING PORTS (TRỤ SẠC TRONG BẾN)
  // =============================================

  @Get(':depotId/ports')
  async findPortsByDepot(@Param('depotId') depotId: string) {
    return this.depotsService.findPortsByDepot(depotId);
  }

  @Get(':depotId/ports/available')
  async findAvailablePorts(@Param('depotId') depotId: string) {
    return this.depotsService.findAvailablePorts(depotId);
  }

  @Post(':depotId/ports')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createPort(@Param('depotId') depotId: string, @Body() data: any) {
    return this.depotsService.createPort({ ...data, depot_id: depotId });
  }

  @Put('ports/:portId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updatePort(@Param('portId') portId: string, @Body() data: any) {
    return this.depotsService.updatePort(portId, data);
  }

  @Delete('ports/:portId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deletePort(@Param('portId') portId: string) {
    return this.depotsService.deletePort(portId);
  }
}

// =============================================
// CHARGING SESSIONS CONTROLLER (PHIÊN SẠC)
// =============================================

@Controller('charging')
@UseGuards(AuthGuard)
export class ChargingController {
  constructor(private readonly depotsService: DepotsService) {}

  // Bắt đầu phiên sạc - Tài xế chọn trụ sạc để sạc
  @Post('start')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async startChargingSession(
    @CurrentUser() user: any,
    @Body()
    body: {
      vehicle_id: string;
      depot_id: string;
      charging_port_id: string;
      start_battery_level?: number;
    },
  ) {
    // Lấy driver_id từ user hiện tại
    return this.depotsService.startChargingSession({
      ...body,
      driver_id: user.driver_id || user.id,
    });
  }

  // Kết thúc phiên sạc
  @Put('end/:sessionId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async endChargingSession(
    @Param('sessionId') sessionId: string,
    @Body()
    body: {
      end_battery_level?: number;
      energy_consumed?: number;
    },
  ) {
    return this.depotsService.endChargingSession(sessionId, body);
  }

  // Lấy phiên sạc đang hoạt động của tài xế
  @Get('active')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async getActiveSession(@CurrentUser() user: any) {
    return this.depotsService.getActiveSession(user.driver_id || user.id);
  }

  // Lịch sử sạc
  @Get('sessions')
  async getChargingSessions(
    @Query('vehicle_id') vehicle_id?: string,
    @Query('driver_id') driver_id?: string,
    @Query('depot_id') depot_id?: string,
    @Query('port_id') port_id?: string,
  ) {
    return this.depotsService.getChargingSessions({
      vehicle_id,
      driver_id,
      depot_id,
      port_id,
    });
  }
}
