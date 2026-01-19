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
import { PricingService } from './pricing.service';
import { CreatePricingDto, UpdatePricingDto } from '../../common/dto';
import { AuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';

@Controller('pricing')
@UseGuards(AuthGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('is_active') is_active?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.pricingService.findAll({
      page,
      limit,
      is_active,
      sortBy,
      sortOrder,
    });
  }

  @Get('active')
  async getActivePricings() {
    return this.pricingService.getActivePricings();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.pricingService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createDto: CreatePricingDto) {
    return this.pricingService.create(createDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateDto: UpdatePricingDto) {
    return this.pricingService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.pricingService.delete(id);
  }

  @Post('calculate')
  async calculatePrice(
    @Body('pricing_id') pricingId: string,
    @Body('distance') distance: number,
    @Body('weight') weight?: number,
    @Body('volume') volume?: number,
  ) {
    return this.pricingService.calculatePrice(
      pricingId,
      distance,
      weight,
      volume,
    );
  }
}
