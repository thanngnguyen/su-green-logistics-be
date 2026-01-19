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
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from '../../common/dto';
import { AuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../common/enums';

@Controller('vehicles')
@UseGuards(AuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('driver_id') driver_id?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.vehiclesService.findAll({
      page,
      limit,
      status,
      driver_id,
      sortBy,
      sortOrder,
    });
  }

  @Get('available')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAvailableVehicles() {
    return this.vehiclesService.getAvailableVehicles();
  }

  @Get('maintenance-needed')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getVehiclesNeedingMaintenance() {
    return this.vehiclesService.getVehiclesNeedingMaintenance();
  }

  @Get('my-vehicle')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async getMyVehicle(@CurrentUser() user: any) {
    return this.vehiclesService.getVehicleByDriver(user.driver_id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DRIVER)
  async update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Put(':id/assign/:driverId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async assignToDriver(
    @Param('id') id: string,
    @Param('driverId') driverId: string,
  ) {
    return this.vehiclesService.assignToDriver(id, driverId);
  }

  @Put(':id/unassign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async unassignFromDriver(@Param('id') id: string) {
    return this.vehiclesService.unassignFromDriver(id);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DRIVER)
  async updateStatus(
    @Param('id') id: string,
    @Body('status')
    status: 'available' | 'in_use' | 'charging' | 'maintenance' | 'inactive',
  ) {
    return this.vehiclesService.updateStatus(id, status);
  }

  @Put(':id/battery')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DRIVER)
  async updateBatteryLevel(
    @Param('id') id: string,
    @Body('battery_level') batteryLevel: number,
  ) {
    return this.vehiclesService.updateBatteryLevel(id, batteryLevel);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.vehiclesService.delete(id);
  }
}
