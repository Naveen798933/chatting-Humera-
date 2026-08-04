import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
// Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project credentials from Supabase Dashboard
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mlnlslpfencaaknnzwqk.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_gGZoyNKvylaKLmKiFl82yw_tljQz_Bi';

export const isSupabaseConfigured = () => {
  return (
    SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_ANON_KEY)
  );
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
