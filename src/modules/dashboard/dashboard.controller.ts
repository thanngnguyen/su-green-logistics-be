import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../common/enums';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAdminStats() {
    return this.dashboardService.getAdminDashboardStats();
  }

  @Get('driver/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async getDriverStats(@CurrentUser() user: any) {
    return this.dashboardService.getDriverDashboardStats(user.driver_id);
  }

  @Get('revenue-report')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getRevenueReport(
    @Query('from_date') from_date?: string,
    @Query('to_date') to_date?: string,
    @Query('group_by') group_by?: 'day' | 'week' | 'month',
  ) {
    return this.dashboardService.getRevenueReport({
      from_date,
      to_date,
      group_by,
    });
  }

  @Get('orders-report')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getOrdersReport(
    @Query('from_date') from_date?: string,
    @Query('to_date') to_date?: string,
    @Query('status') status?: string,
  ) {
    return this.dashboardService.getOrdersReport({
      from_date,
      to_date,
      status,
    });
  }

  // Notifications
  @Get('notifications')
  async getNotifications(@CurrentUser() user: any) {
    return this.dashboardService.getUserNotifications(user.id);
  }

  @Put('notifications/:id/read')
  async markNotificationAsRead(@Param('id') id: string) {
    return this.dashboardService.markNotificationAsRead(id);
  }

  @Put('notifications/read-all')
  async markAllNotificationsAsRead(@CurrentUser() user: any) {
    return this.dashboardService.markAllNotificationsAsRead(user.id);
  }
}
