/**
 * Script to reset admin password
 * Run: npx ts-node src/scripts/reset-admin-password.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const ADMIN_ID = '5f518460-18ae-4c05-a956-22ce292ae15a';
const NEW_PASSWORD = 'Admin@123456';

async function resetPassword() {
  console.log('🔄 Resetting admin password...');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const { data, error } = await supabase.auth.admin.updateUserById(ADMIN_ID, {
      password: NEW_PASSWORD,
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Password reset successfully!');
    console.log('📧 Email:', data.user.email);
    console.log('🔑 New Password:', NEW_PASSWORD);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

resetPassword();
