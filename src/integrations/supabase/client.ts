import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabaseStorageUrl = import.meta.env.VITE_SUPABASE_STORAGE_URL;

if (!supabaseUrl || !supabaseAnonKey || !supabaseStorageUrl) {
  throw new Error('Supabase URL, anon key, or storage URL are not defined in the environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    //headers: { 'x-storage-url': supabaseStorageUrl }
  },
  storage: {
    url: supabaseStorageUrl,
  }
});
