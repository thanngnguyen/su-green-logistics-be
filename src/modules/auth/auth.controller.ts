import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../../common/dto';
import { CreateUserDto } from '../../common/dto';
import { AuthGuard, AdminGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Headers('authorization') authHeader: string) {
    const token = authHeader?.replace('Bearer ', '');
    return this.authService.logout(token);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  @Post('refresh')
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  /**
   * Admin: Tạo tài khoản cho supplier hoặc driver
   * POST /auth/admin/create-user
   */
  @Post('admin/create-user')
  @UseGuards(AuthGuard, AdminGuard)
  async createUserByAdmin(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUserAccount(createUserDto);
  }

  /**
   * Đổi mật khẩu lần đầu
   * POST /auth/change-password-first-time
   */
  @Post('change-password-first-time')
  @UseGuards(AuthGuard)
  async changePasswordFirstTime(
    @CurrentUser() user: any,
    @Body() changePasswordDto: { old_password: string; new_password: string },
  ) {
    return this.authService.changePasswordFirstTime(
      user.id,
      changePasswordDto.old_password,
      changePasswordDto.new_password,
    );
  }
}
