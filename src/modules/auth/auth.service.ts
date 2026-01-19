import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../common/supabase';
import { CreateUserDto, LoginDto, RegisterDto } from '../../common/dto';
import { User } from '../../common/interfaces';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url') || '',
      this.configService.get<string>('supabase.anonKey') || '',
    );
  }

  /**
   * Tạo tài khoản cho driver (tài xế)
   * Chỉ admin mới có thể gọi hàm này
   */
  async createUserAccount(createUserDto: CreateUserDto) {
    // Check if user exists
    const existingUsers = await this.supabaseService.findAll<User>('users', {
      filter: { email: createUserDto.email },
    });

    if (existingUsers.length > 0) {
      throw new BadRequestException('Email đã được đăng ký');
    }

    // Validate role - chỉ cho phép tạo driver (hệ thống chỉ có admin và driver)
    if (createUserDto.role !== 'driver') {
      throw new BadRequestException(
        'Chỉ có thể tạo tài khoản cho tài xế (driver)',
      );
    }

    // Tạo password tạm thời nếu không có
    const tempPassword =
      createUserDto.password || this.generateTemporaryPassword();
    const password_hash = await bcrypt.hash(tempPassword, 10);

    // Tạo user trong database
    const user = await this.supabaseService.create<User>('users', {
      email: createUserDto.email,
      password_hash,
      full_name: createUserDto.full_name,
      phone: createUserDto.phone,
      role: createUserDto.role,
      status: 'active',
      address: createUserDto.address,
    });

    return {
      user,
      temporary_password: tempPassword,
      message: 'Tài khoản tài xế đã được tạo thành công. Vui lòng gửi mật khẩu tạm thời cho người dùng.',
    };
  }

  /**
   * Tạo password tạm thời ngẫu nhiên
   */
  private generateTemporaryPassword(): string {
    const length = 12;
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Đổi mật khẩu lần đầu tiên (sau khi người dùng đăng nhập lần đầu)
   */
  async changePasswordFirstTime(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.supabaseService.findOne<User>('users', userId);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      user.password_hash || '',
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không chính xác');
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, 10);

    // Update password
    const updatedUser = await this.supabaseService.update<User>(
      'users',
      userId,
      {
        password_hash,
      },
    );

    return {
      message: 'Mật khẩu đã được cập nhật thành công',
      user: updatedUser,
    };
  }

  async login(loginDto: LoginDto) {
    // Thử đăng nhập với Supabase Auth trước
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    // Nếu Supabase Auth thất bại, thử xác thực bằng bcrypt
    if (error) {
      console.log('Supabase Auth error:', error.message);

      // Tìm user trong database
      const users = await this.supabaseService.findAll<User>('users', {
        filter: { email: loginDto.email },
      });

      if (users.length === 0) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const user = users[0];

      // Kiểm tra password với bcrypt
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password_hash || '',
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.status !== 'active') {
        throw new UnauthorizedException('Account is not active');
      }

      // Tạo session giả lập nếu không có Supabase session
      return {
        user,
        session: {
          access_token: `manual_${user.id}_${Date.now()}`,
          refresh_token: `refresh_${user.id}_${Date.now()}`,
          expires_in: 604800,
          token_type: 'bearer',
        },
      };
    }

    // Get user from database
    const users = await this.supabaseService.findAll<User>('users', {
      filter: { email: loginDto.email },
    });

    if (users.length === 0) {
      throw new UnauthorizedException('User not found');
    }

    const user = users[0];

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
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
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.supabaseService.findOne<User>('users', userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      session: data.session,
    };
  }
}
