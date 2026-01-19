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
import { DriversService, StoresService } from './entities.service';
import { AuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../common/enums';

// ...existing code...

// Drivers Controller
@Controller('drivers')
@UseGuards(AuthGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('is_available') is_available?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.driversService.findAll({
      page,
      limit,
      is_available,
      sortBy,
      sortOrder,
    });
  }

  @Get('available')
  async getAvailableDrivers() {
    return this.driversService.getAvailableDrivers();
  }

  @Get('nearby')
  async findNearbyDrivers(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
  ) {
    return this.driversService.findNearbyDrivers(lat, lng, radius || 10);
  }

  @Get('me')
  async getMyProfile(@CurrentUser() user: any) {
    return this.driversService.findByUserId(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() data: any) {
    return this.driversService.create(data);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DRIVER)
  async update(@Param('id') id: string, @Body() data: any) {
    return this.driversService.update(id, data);
  }

  @Put(':id/location')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async updateLocation(
    @Param('id') id: string,
    @Body('lat') lat: number,
    @Body('lng') lng: number,
  ) {
    return this.driversService.updateLocation(id, lat, lng);
  }

  @Put(':id/availability')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  async updateAvailability(
    @Param('id') id: string,
    @Body('is_available') isAvailable: boolean,
  ) {
    return this.driversService.updateAvailability(id, isAvailable);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.driversService.delete(id);
  }
}

// Stores Controller
@Controller('stores')
@UseGuards(AuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('green_zone_id') green_zone_id?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.storesService.findAll({
      page,
      limit,
      green_zone_id,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() data: any) {
    return this.storesService.create(data);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() data: any) {
    return this.storesService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.storesService.delete(id);
  }
}
