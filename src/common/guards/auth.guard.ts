import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      // Use anon key for token verification
      const supabaseAuth = createClient(
        this.configService.get<string>('supabase.url') || '',
        this.configService.get<string>('supabase.anonKey') || '',
      );

      const {
        data: { user: authUser },
        error,
      } = await supabaseAuth.auth.getUser(token);

      if (error || !authUser) {
        throw new UnauthorizedException('Invalid token');
      }

      // Use service role key to query database (bypass RLS)
      const supabaseAdmin = createClient(
        this.configService.get<string>('supabase.url') || '',
        this.configService.get<string>('supabase.serviceRoleKey') || '',
      );

      // Get full user profile from database including role
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select(
          'id, full_name, phone, avatar_url, role, address, created_at, updated_at',
        )
        .eq('id', authUser.id)
        .single();

      if (profileError || !userProfile) {
        throw new UnauthorizedException('User profile not found');
      }

      // Initialize user object with profile data
      let userData: any = {
        ...authUser,
        ...userProfile,
        email: authUser.email,
      };

      // If user is a driver, get their driver_id from drivers table
      if (userProfile.role === 'driver') {
        const { data: driverProfile } = await supabaseAdmin
          .from('drivers')
          .select('id')
          .eq('user_id', authUser.id)
          .single();

        if (driverProfile) {
          userData.driver_id = driverProfile.id;
        }
      }

      // Merge auth user with profile data
      request.user = userData;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
