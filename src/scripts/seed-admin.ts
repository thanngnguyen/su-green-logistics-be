/**
 * Script to seed admin user in Supabase
 * Run: npx ts-node src/scripts/seed-admin.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const ADMIN_EMAIL = 'admin@greenlogistics.vn';
const ADMIN_PASSWORD = 'Admin@123456';

async function seedAdmin() {
  console.log('🌱 Starting admin seed...');
  console.log('Supabase URL:', SUPABASE_URL);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Check if admin already exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (existingUser) {
      console.log('✅ Admin user already exists in users table');
      console.log('   ID:', existingUser.id);
      console.log('   Name:', existingUser.full_name);

      // Check if auth user exists
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const authUser = authUsers?.users.find(
        (u: any) => u.id === existingUser.id,
      );

      if (authUser) {
        console.log('   Email:', (authUser as any).email);
      }

      return;
    }

    // Create admin user in Supabase Auth
    console.log('Creating admin user in auth...');
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: 'System Admin',
          role: 'admin',
        },
      });

    if (authError) {
      // Check if user already exists in auth
      if (authError.message.includes('already been registered')) {
        console.log('⚠️ Auth user already exists, checking for profile...');

        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const existingAuthUser = authUsers?.users.find(
          (u: any) => u.email === ADMIN_EMAIL,
        );

        if (existingAuthUser) {
          // Create profile if not exists
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', existingAuthUser.id)
            .single();

          if (!profile) {
            const { error: insertError } = await supabase.from('users').insert({
              id: existingAuthUser.id,
              full_name: 'System Admin',
              role: 'admin',
              status: 'active',
            });

            if (insertError) {
              console.error('❌ Error creating profile:', insertError);
            } else {
              console.log('✅ Profile created for existing auth user');
            }
          }
        }
        return;
      }

      console.error('❌ Error creating admin user:', authError);

      // Try to create profile directly with a manual ID for testing
      console.log('⚠️ Attempting to create profile directly...');
      const testId = 'a0000000-0000-0000-0000-000000000001';

      const { error: directInsertError } = await supabase.from('users').insert({
        id: testId,
        full_name: 'System Admin',
        role: 'admin',
        status: 'active',
      });

      if (directInsertError) {
        console.error('❌ Direct insert also failed:', directInsertError);
      } else {
        console.log('✅ Created test admin profile (ID:', testId, ')');
        console.log('⚠️ Note: This admin cannot log in via Supabase Auth');
      }

      return;
    }

    console.log('✅ Auth user created, ID:', authData.user.id);

    // Wait for trigger
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check if profile was created by trigger
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      console.log('⚠️ Profile not created by trigger, creating manually...');

      const { error: insertError } = await supabase.from('users').insert({
        id: authData.user.id,
        full_name: 'System Admin',
        role: 'admin',
        status: 'active',
      });

      if (insertError) {
        console.error('❌ Error creating profile:', insertError);
      } else {
        console.log('✅ Profile created manually');
      }
    } else {
      console.log('✅ Profile created by trigger');
    }

    console.log('\n🎉 Admin setup complete!');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Password:', ADMIN_PASSWORD);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

seedAdmin();
