import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase';
import { CreateUserDto, UpdateUserDto } from '../../common/dto';
import { User } from '../../common/interfaces';
import { PaginationParams, PaginatedResponse } from '../../common/interfaces';

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
    if (params?.role) filter.role = params.role;
    if (params?.status) filter.status = params.status;

    const [users, total] = await Promise.all([
      this.supabaseService.findAll<User>('users', {
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
    const user = await this.supabaseService.findOne<User>('users', id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const users = await this.supabaseService.findAll<User>('users', {
      filter: { email },
    });
    return users[0] || null;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    return this.supabaseService.update<User>('users', id, updateUserDto);
  }

  async delete(id: string): Promise<void> {
    await this.supabaseService.delete('users', id);
  }

  async updateStatus(
    id: string,
    status: 'active' | 'inactive' | 'pending' | 'suspended',
  ): Promise<User> {
    return this.supabaseService.update<User>('users', id, { status });
  }

  async getAdmins(): Promise<User[]> {
    return this.supabaseService.findAll<User>('users', {
      filter: { role: 'admin' },
    });
  }
}
