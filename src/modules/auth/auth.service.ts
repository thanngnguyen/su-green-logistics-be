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

// User columns to select from users table
const USER_SELECT_COLUMNS =
  'id, email, full_name, phone, avatar_url, role, address, created_at, updated_at';

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
   * Tạo tài khoản cho người dùng mới (admin, driver)
   * Chỉ admin mới có thể gọi hàm này
   * Sử dụng Supabase Auth để quản lý người dùng
   */
  async createUserAccount(createUserDto: CreateUserDto) {
    // Validate role - chỉ cho phép tạo driver hoặc admin
    const allowedRoles = ['driver', 'admin'];
    if (!allowedRoles.includes(createUserDto.role)) {
      throw new BadRequestException(
        'Chỉ có thể tạo tài khoản cho tài xế (driver) hoặc quản trị viên (admin)',
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
      console.error('Supabase Auth Error:', authError);
      throw new BadRequestException(
        authError.message || 'Không thể tạo tài khoản. Vui lòng thử lại.',
      );
    }

    if (!authData?.user) {
      throw new BadRequestException(
        'Không thể tạo tài khoản. Vui lòng thử lại.',
      );
    }

    // Tự tạo user profile thay vì dựa vào trigger (tránh lỗi column status)
    const adminClient = this.supabaseService.getAdminClient();
    const { error: userProfileError } = await adminClient.from('users').upsert(
      {
        id: authData.user.id,
        email: createUserDto.email, // Lưu email vào users table
        full_name: createUserDto.full_name,
        phone: createUserDto.phone || null,
        role: createUserDto.role,
        address: createUserDto.address || null,
      },
      { onConflict: 'id' },
    );

    if (userProfileError) {
      console.error('Error creating user profile:', userProfileError);
      // Xóa auth user nếu tạo profile thất bại
      await this.supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new BadRequestException('Không thể tạo hồ sơ người dùng');
    }

    // Chờ một chút để đảm bảo dữ liệu đã được ghi
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Lấy user profile từ database
    const user = await this.supabaseService.findOne<User>(
      'users',
      authData.user.id,
      USER_SELECT_COLUMNS,
    );

    const roleLabel =
      createUserDto.role === 'admin' ? 'quản trị viên' : 'tài xế';
    return {
      user: user || authData.user,
      temporary_password: tempPassword,
      message: `Tài khoản ${roleLabel} đã được tạo thành công. Vui lòng gửi mật khẩu tạm thời cho người dùng.`,
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

    // Define columns to select from users table (status column does not exist)
    const userSelect =
      'id, full_name, phone, avatar_url, role, address, created_at, updated_at';

    // Lấy user từ database
    const user = await this.supabaseService.findOne<User>(
      'users',
      data.user.id,
      userSelect,
    );

    if (!user) {
      throw new UnauthorizedException(
        'Người dùng không tồn tại trong hệ thống',
      );
    }

    // Skip status check since column may not exist
    // if (user.status && user.status !== 'active') {
    //   throw new UnauthorizedException('Tài khoản chưa được kích hoạt');
    // }

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
    const userSelect =
      'id, full_name, phone, avatar_url, role, address, created_at, updated_at';
    const user = await this.supabaseService.findOne<User>(
      'users',
      userId,
      userSelect,
    );
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
