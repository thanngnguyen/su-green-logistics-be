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
import { PartnerRequestsService } from './partner-requests.service';
import {
  CreatePartnerRequestDto,
  UpdatePartnerRequestDto,
} from './partner-requests.dto';
import { AuthGuard, AdminGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@Controller('partner-requests')
export class PartnerRequestsController {
  constructor(private readonly partnerRequestsService: PartnerRequestsService) {}

  /**
   * PUBLIC: Gửi đăng ký hợp tác
   * POST /partner-requests
   */
  @Post()
  async create(@Body() createDto: CreatePartnerRequestDto) {
    return this.partnerRequestsService.create(createDto);
  }

  /**
   * ADMIN: Lấy danh sách đăng ký hợp tác
   * GET /partner-requests
   */
  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  async findAll(
    @Query('status') status?: string,
    @Query('partner_type') partner_type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.partnerRequestsService.findAll({
      status,
      partner_type,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * ADMIN: Đếm số đăng ký đang chờ xử lý
   * GET /partner-requests/pending-count
   */
  @Get('pending-count')
  @UseGuards(AuthGuard, AdminGuard)
  async countPending() {
    const count = await this.partnerRequestsService.countPending();
    return { count };
  }

  /**
   * ADMIN: Lấy chi tiết đăng ký
   * GET /partner-requests/:id
   */
  @Get(':id')
  @UseGuards(AuthGuard, AdminGuard)
  async findOne(@Param('id') id: string) {
    return this.partnerRequestsService.findOne(id);
  }

  /**
   * ADMIN: Cập nhật trạng thái đăng ký
   * PUT /partner-requests/:id
   */
  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePartnerRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.partnerRequestsService.update(id, updateDto, user.id);
  }

  /**
   * ADMIN: Xóa đăng ký
   * DELETE /partner-requests/:id
   */
  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    return this.partnerRequestsService.remove(id);
  }
}
