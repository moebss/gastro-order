let cachedClient: any = null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function getSupabaseClient() {
  if (!isSupabaseConfigured) return null;
  if (!cachedClient) {
    try {
      const { createClient } = require("@supabase/supabase-js");
      cachedClient = createClient(supabaseUrl!, supabaseAnonKey!);
    } catch (e) {
      console.warn("Konnte Supabase-Client nicht initialisieren:", e);
      return null;
    }
  }
  return cachedClient;
}

export const supabase = isSupabaseConfigured ? getSupabaseClient() : null;
