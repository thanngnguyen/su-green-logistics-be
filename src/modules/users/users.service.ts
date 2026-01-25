import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';
import { CreateUserDto, UpdateUserDto } from '../../common/dto';
import { User } from '../../common/interfaces';
import { PaginationParams, PaginatedResponse } from '../../common/interfaces';

// Define columns to select from users table
const USER_SELECT_COLUMNS =
  'id, email, full_name, phone, avatar_url, role, address, created_at, updated_at';

@Injectable()
export class UsersService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(
    params?: PaginationParams & { role?: string; status?: string },
  ): Promise<PaginatedResponse<User>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    const filter: Record<string, any> = {};
    // Only add filter if value exists, is not empty, and is not 'undefined' or 'all'
    if (
      params?.role &&
      params.role !== '' &&
      params.role !== 'undefined' &&
      params.role !== 'all'
    ) {
      filter.role = params.role;
    }
    // Note: status filter removed as the column may not exist in database
    // If status column exists, uncomment the following:
    // if (
    //   params?.status &&
    //   params.status !== '' &&
    //   params.status !== 'undefined'
    // ) {
    //   filter.status = params.status;
    // }

    const [users, total] = await Promise.all([
      this.supabaseService.findAll<User>('users', {
        select: USER_SELECT_COLUMNS,
        filter,
        orderBy: {
          column: params?.sortBy || 'created_at',
          ascending: params?.sortOrder === 'asc',
        },
        limit,
        offset,
      }),
      this.supabaseService.count('users', filter),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.supabaseService.findOne<User>(
      'users',
      id,
      USER_SELECT_COLUMNS,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const users = await this.supabaseService.findAll<User>('users', {
      select: USER_SELECT_COLUMNS,
      filter: { email },
    });
    return users[0] || null;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    return this.supabaseService.update<User>(
      'users',
      id,
      updateUserDto,
      USER_SELECT_COLUMNS,
    );
  }

  async delete(id: string): Promise<void> {
    await this.supabaseService.delete('users', id);
  }

  async updateStatus(
    id: string,
    status: 'active' | 'inactive' | 'pending' | 'suspended',
  ): Promise<User> {
    // Note: This may fail if 'status' column doesn't exist in database
    try {
      return await this.supabaseService.update<User>(
        'users',
        id,
        { status },
        USER_SELECT_COLUMNS,
      );
    } catch (error) {
      // If status column doesn't exist, just return the current user
      console.warn('Status column may not exist:', error);
      return this.findOne(id);
    }
  }

  async getAdmins(): Promise<User[]> {
    return this.supabaseService.findAll<User>('users', {
      select: USER_SELECT_COLUMNS,
      filter: { role: 'admin' },
    });
  }
}
