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
import { PartnersService } from './partners.service';
import { CreatePartnerDto, UpdatePartnerDto } from './partners.dto';
import { AuthGuard, AdminGuard } from '../../common/guards';

@Controller('partners')
@UseGuards(AuthGuard, AdminGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  /**
   * ADMIN: Tạo đối tác mới
   * POST /partners
   */
  @Post()
  async create(@Body() createDto: CreatePartnerDto) {
    return this.partnersService.create(createDto);
  }

  /**
   * ADMIN: Lấy danh sách đối tác
   * GET /partners
   */
  @Get()
  async findAll(
    @Query('contract_status') contract_status?: string,
    @Query('partner_type') partner_type?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.partnersService.findAll({
      contract_status,
      partner_type,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * ADMIN: Đếm số đối tác đang hoạt động
   * GET /partners/active-count
   */
  @Get('active-count')
  async countActive() {
    const count = await this.partnersService.countActive();
    return { count };
  }

  /**
   * ADMIN: Lấy chi tiết đối tác
   * GET /partners/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.partnersService.findOne(id);
  }

  /**
   * ADMIN: Cập nhật thông tin đối tác
   * PUT /partners/:id
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdatePartnerDto) {
    return this.partnersService.update(id, updateDto);
  }

  /**
   * ADMIN: Xóa đối tác
   * DELETE /partners/:id
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.partnersService.remove(id);
  }
}
