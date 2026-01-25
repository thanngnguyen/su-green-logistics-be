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
import { DriversService } from './drivers.service';
import { AuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../common/enums';

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
    @Query('is_available') is_available?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    // Convert is_available string to boolean
    let isAvailableBool: boolean | undefined;
    if (is_available === 'true') {
      isAvailableBool = true;
    } else if (is_available === 'false') {
      isAvailableBool = false;
    }

    return this.driversService.findAll({
      page,
      limit,
      is_available: isAvailableBool,
      sortBy,
      sortOrder,
    });
  }

  @Get('available')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAvailableDrivers() {
    return this.driversService.getAvailableDrivers();
  }

  @Get('nearby')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getNearbyDrivers(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
  ) {
    return this.driversService.getNearbyDrivers(lat, lng, radius);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createDriverDto: any) {
    return this.driversService.create(createDriverDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateDriverDto: any) {
    return this.driversService.update(id, updateDriverDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.driversService.delete(id);
  }

  @Put(':id/location')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async updateLocation(
    @Param('id') id: string,
    @Body() data: { lat: number; lng: number },
  ) {
    return this.driversService.updateLocation(id, data.lat, data.lng);
  }

  @Put(':id/availability')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DRIVER)
  async updateAvailability(
    @Param('id') id: string,
    @Body() data: { is_available: boolean },
  ) {
    return this.driversService.updateAvailability(id, data.is_available);
  }
}
