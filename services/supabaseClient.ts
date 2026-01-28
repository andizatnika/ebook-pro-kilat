import { createClient } from '@supabase/supabase-js';

// --- KONFIGURASI SUPABASE ---
// Project URL dan Anon Key telah dikonfigurasi.

const SUPABASE_URL: string = 'https://qwfywuaaegptcploevao.supabase.co';
const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Znl3dWFhZWdwdGNwbG9ldmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjIwNTYsImV4cCI6MjA4NDczODA1Nn0.qv19Rn2vmhcilvMrADHVQh3YiXA6tsKA1oaPBVa8qxA';

// Helper untuk mengecek env vars (opsional jika menggunakan .env)
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

// Prioritas: String hardcoded di atas -> Environment Variable -> Placeholder
const finalUrl = (SUPABASE_URL !== 'GANTI_DENGAN_SUPABASE_URL_ANDA' && SUPABASE_URL !== '' ? SUPABASE_URL : getEnv('SUPABASE_URL')) || 'https://placeholder.supabase.co';
const finalKey = (SUPABASE_ANON_KEY !== 'GANTI_DENGAN_SUPABASE_ANON_KEY_ANDA' && SUPABASE_ANON_KEY !== '' ? SUPABASE_ANON_KEY : getEnv('SUPABASE_ANON_KEY')) || 'placeholder-key';

// Cek apakah konfigurasi valid (bukan placeholder)
export const isSupabaseConfigured = finalUrl !== 'https://placeholder.supabase.co' && !finalUrl.includes('GANTI_DENGAN');

export const supabase = createClient(finalUrl, finalKey);