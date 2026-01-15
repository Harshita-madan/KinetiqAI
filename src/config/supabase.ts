import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Read Supabase credentials from environment variables
// Get these from: https://supabase.com/dashboard/project/_/settings/api
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('⚠️ Supabase environment variables not configured!');
  console.error('Make sure you have created a .env file with:');
  console.error('EXPO_PUBLIC_SUPABASE_URL=your_project_url');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
}

// Validate URL format
if (SUPABASE_URL && !SUPABASE_URL.startsWith('http')) {
  console.error('⚠️ Invalid SUPABASE_URL format. Must start with http:// or https://');
  console.error('Current value:', SUPABASE_URL);
}

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http');
};
