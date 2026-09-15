import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://tcituxdzdqjgslhctncu.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_GSl2TRJxreXMZTgMh458dw_XjotPnA2";

const SUPABASE_SECRET =
  process.env.SUPABASE_SECRET_KEY ||
  "sb_secret_2qYNSLLYY5GL-r3WE8duUg_siyK9cpL";

let browserClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

/**
 * Public browser-safe Supabase client
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === "undefined") {
    return createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return browserClient;
}

/**
 * Server-only admin Supabase client with secret key bypassing RLS
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(SUPABASE_URL, SUPABASE_SECRET, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return adminClient;
}
