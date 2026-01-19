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
import { ReportsService } from './reports.service';
import { CreateReportDto, UpdateReportDto } from '../../common/dto';
import { AuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../common/enums';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('report_type') report_type?: string,
    @Query('priority') priority?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.reportsService.findAll({
      page,
      limit,
      status,
      report_type,
      priority,
      sortBy,
      sortOrder,
    });
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPendingReports() {
    return this.reportsService.getPendingReports();
  }

  @Get('urgent')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUrgentReports() {
    return this.reportsService.getUrgentReports();
  }

  @Get('my-reports')
  async getMyReports(@CurrentUser() user: any) {
    return this.reportsService.getReportsByReporter(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateReportDto, @CurrentUser() user: any) {
    return this.reportsService.create({ ...createDto, reporter_id: user.id });
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateDto: UpdateReportDto) {
    return this.reportsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.reportsService.delete(id);
  }
}
