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
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
  AssignDriverDto,
} from '../../common/dto';
import { AuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../common/enums';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.create(createOrderDto, user.id);
  }

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
    return this.ordersService.findAll({
      page,
      limit,
      status,
      driver_id,
      sortBy,
      sortOrder,
    });
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DRIVER)
  async getPendingOrders() {
    return this.ordersService.getPendingOrders();
  }

  @Get('my-orders')
  async getMyOrders(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // Only driver role supported now
    return this.ordersService.getOrdersByDriver(user.driver_id, {
      page,
      limit,
    });
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    return this.ordersService.findByCode(code);
  }

  @Get(':id/tracking')
  async getTracking(@Param('id') id: string) {
    return this.ordersService.getTracking(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Put(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async assignDriver(
    @Param('id') id: string,
    @Body() assignDriverDto: AssignDriverDto,
  ) {
    return this.ordersService.assignDriver(id, assignDriverDto);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DRIVER)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateStatusDto);
  }

  /**
   * DRIVER: Check-in khi lấy hàng tại điểm tập kết
   */
  @Post(':id/checkin/pickup')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async checkinPickup(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body()
    checkinData: {
      photo_url?: string;
      note?: string;
      lat?: number;
      lng?: number;
    },
  ) {
    return this.ordersService.driverCheckin(
      id,
      user.driver_id,
      'pickup',
      checkinData,
    );
  }

  /**
   * DRIVER: Check-in khi giao hàng xong tại cửa hàng
   */
  @Post(':id/checkin/delivery')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async checkinDelivery(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body()
    checkinData: {
      photo_url?: string;
      signature?: string;
      receiver_name?: string;
      note?: string;
      lat?: number;
      lng?: number;
    },
  ) {
    return this.ordersService.driverCheckin(
      id,
      user.driver_id,
      'delivery',
      checkinData,
    );
  }

  /**
   * DRIVER: Lấy thống kê KPI của mình
   */
  @Get('my-kpi')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async getMyKpi(@CurrentUser() user: any) {
    return this.ordersService.getDriverKpi(user.driver_id);
  }

  /**
   * ADMIN: Xem thống kê KPI của tất cả tài xế
   */
  @Get('admin/drivers-kpi')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getDriversKpiSummary(@Query('date') date?: string) {
    return this.ordersService.getDriversKpiSummary(date);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.ordersService.delete(id);
  }
}
