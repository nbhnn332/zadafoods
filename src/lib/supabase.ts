import { createClient } from '@supabase/supabase-js';

export const STAGING_SUPABASE_URL = 'https://ykzgqaepayuqatgbvsoq.supabase.co';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || STAGING_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL || STAGING_SUPABASE_URL;
  const anonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return (
    !!url &&
    url !== 'https://placeholder.supabase.co' &&
    !!anonKey &&
    anonKey !== 'placeholder-anon-key' &&
    anonKey.trim().length > 0 &&
    !anonKey.includes('placeholder')
  );
};
