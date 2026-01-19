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
import { GreenZonesService } from './green-zones.service';
import {
  CreateGreenZoneDto,
  UpdateGreenZoneDto,
  CreateBufferZoneDto,
  UpdateBufferZoneDto,
} from '../../common/dto';
import { AuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';

@Controller('green-zones')
@UseGuards(AuthGuard)
export class GreenZonesController {
  constructor(private readonly greenZonesService: GreenZonesService) {}

  // Green Zones
  @Get()
  async findAllGreenZones(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('is_active') is_active?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.greenZonesService.findAllGreenZones({
      page,
      limit,
      is_active,
      sortBy,
      sortOrder,
    });
  }

  @Get('active')
  async getActiveGreenZones() {
    return this.greenZonesService.getActiveGreenZones();
  }

  @Get(':id')
  async findOneGreenZone(@Param('id') id: string) {
    return this.greenZonesService.findOneGreenZone(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createGreenZone(@Body() createDto: CreateGreenZoneDto) {
    return this.greenZonesService.createGreenZone(createDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateGreenZone(
    @Param('id') id: string,
    @Body() updateDto: UpdateGreenZoneDto,
  ) {
    return this.greenZonesService.updateGreenZone(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteGreenZone(@Param('id') id: string) {
    return this.greenZonesService.deleteGreenZone(id);
  }

  // Buffer Zones
  @Get('buffer-zones/all')
  async findAllBufferZones(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('green_zone_id') green_zone_id?: string,
    @Query('is_active') is_active?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.greenZonesService.findAllBufferZones({
      page,
      limit,
      green_zone_id,
      is_active,
      sortBy,
      sortOrder,
    });
  }

  @Get(':greenZoneId/buffer-zones')
  async getBufferZonesByGreenZone(@Param('greenZoneId') greenZoneId: string) {
    return this.greenZonesService.getBufferZonesByGreenZone(greenZoneId);
  }

  @Get('buffer-zones/:id')
  async findOneBufferZone(@Param('id') id: string) {
    return this.greenZonesService.findOneBufferZone(id);
  }

  @Post('buffer-zones')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createBufferZone(@Body() createDto: CreateBufferZoneDto) {
    return this.greenZonesService.createBufferZone(createDto);
  }

  @Put('buffer-zones/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateBufferZone(
    @Param('id') id: string,
    @Body() updateDto: UpdateBufferZoneDto,
  ) {
    return this.greenZonesService.updateBufferZone(id, updateDto);
  }

  @Delete('buffer-zones/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteBufferZone(@Param('id') id: string) {
    return this.greenZonesService.deleteBufferZone(id);
  }
}
