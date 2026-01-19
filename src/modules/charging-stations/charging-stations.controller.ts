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
import { ChargingStationsService } from './charging-stations.service';
import {
  CreateChargingStationDto,
  UpdateChargingStationDto,
  StartChargingSessionDto,
  EndChargingSessionDto,
} from '../../common/dto';
import { AuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../common/enums';

@Controller('charging-stations')
@UseGuards(AuthGuard)
export class ChargingStationsController {
  constructor(
    private readonly chargingStationsService: ChargingStationsService,
  ) {}

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('green_zone_id') green_zone_id?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.chargingStationsService.findAll({
      page,
      limit,
      status,
      green_zone_id,
      sortBy,
      sortOrder,
    });
  }

  @Get('nearby')
  async findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
  ) {
    return this.chargingStationsService.findAvailable(lat, lng, radius || 5);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.chargingStationsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createDto: CreateChargingStationDto) {
    return this.chargingStationsService.create(createDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateChargingStationDto,
  ) {
    return this.chargingStationsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.chargingStationsService.delete(id);
  }

  @Post('sessions/start')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async startChargingSession(@Body() dto: StartChargingSessionDto) {
    return this.chargingStationsService.startChargingSession(dto);
  }

  @Put('sessions/:id/end')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async endChargingSession(
    @Param('id') id: string,
    @Body() dto: EndChargingSessionDto,
  ) {
    return this.chargingStationsService.endChargingSession(id, dto);
  }

  @Get('sessions/history')
  async getChargingSessions(
    @Query('vehicle_id') vehicle_id?: string,
    @Query('driver_id') driver_id?: string,
    @Query('station_id') station_id?: string,
  ) {
    return this.chargingStationsService.getChargingSessions({
      vehicle_id,
      driver_id,
      station_id,
    });
  }
}
