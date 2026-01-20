import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../common/supabase';
import { CreateUserDto, LoginDto } from '../../common/dto';
import { User } from '../../common/interfaces';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url') || '',
      this.configService.get<string>('supabase.anonKey') || '',
    );

    // Admin client để tạo user (cần service role key)
    this.supabaseAdmin = createClient(
      this.configService.get<string>('supabase.url') || '',
      this.configService.get<string>('supabase.serviceRoleKey') ||
        this.configService.get<string>('supabase.anonKey') ||
        '',
    );
  }

  /**
   * Tạo tài khoản cho driver (tài xế)
   * Chỉ admin mới có thể gọi hàm này
   * Sử dụng Supabase Auth để quản lý người dùng
   */
  async createUserAccount(createUserDto: CreateUserDto) {
    // Validate role - chỉ cho phép tạo driver
    if (createUserDto.role !== 'driver') {
      throw new BadRequestException(
        'Chỉ có thể tạo tài khoản cho tài xế (driver)',
      );
    }

    // Tạo password tạm thời nếu không có
    const tempPassword =
      createUserDto.password || this.generateTemporaryPassword();

    // Tạo user trong Supabase Auth
    const { data: authData, error: authError } =
      await this.supabaseAdmin.auth.admin.createUser({
        email: createUserDto.email,
        password: tempPassword,
        email_confirm: true, // Xác nhận email luôn
        user_metadata: {
          full_name: createUserDto.full_name,
          phone: createUserDto.phone,
          role: createUserDto.role,
        },
      });

    if (authError) {
      throw new BadRequestException(authError.message);
    }

    // User profile sẽ được tạo tự động bởi trigger handle_new_user
    // Chờ một chút để trigger hoàn thành
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Lấy user profile từ database
    const user = await this.supabaseService.findOne<User>(
      'users',
      authData.user.id,
    );

    // Cập nhật thêm thông tin nếu cần
    if (user && createUserDto.address) {
      await this.supabaseService.update<User>('users', user.id, {
        address: createUserDto.address,
      });
    }

    return {
      user: user || authData.user,
      temporary_password: tempPassword,
      message:
        'Tài khoản tài xế đã được tạo thành công. Vui lòng gửi mật khẩu tạm thời cho người dùng.',
    };
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    // Đổi mật khẩu thông qua Supabase Auth
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      message: 'Mật khẩu đã được cập nhật thành công',
    };
  }

  async login(loginDto: LoginDto) {
    // Đăng nhập với Supabase Auth
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (error) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Lấy user từ database
    const user = await this.supabaseService.findOne<User>(
      'users',
      data.user.id,
    );

    if (!user) {
      throw new UnauthorizedException(
        'Người dùng không tồn tại trong hệ thống',
      );
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Tài khoản chưa được kích hoạt');
    }

    return {
      user,
      session: data.session,
    };
  }

  async logout(token: string) {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new BadRequestException(error.message);
    }
    return { message: 'Đăng xuất thành công' };
  }

  async getProfile(userId: string) {
    const user = await this.supabaseService.findOne<User>('users', userId);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }
    return user;
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    return {
      session: data.session,
    };
  }

  private generateTemporaryPassword(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
