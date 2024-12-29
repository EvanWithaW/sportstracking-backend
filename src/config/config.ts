import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

dotenv.config();

// Fallback secret generation (for development ONLY)
function generateFallbackSecret(): string {
  console.warn('Using generated fallback JWT secret. Set JWT_SECRET in .env for production!');
  return crypto.randomBytes(64).toString('hex');
}

export const config = {
  PORT: process.env.PORT || 5001,
  JWT_SECRET: process.env.JWT_SECRET || generateFallbackSecret(),
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || ''
};

// console.log('JWT Secret:', config.JWT_SECRET);

export const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);