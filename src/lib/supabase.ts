import { createClient, SupabaseClient } from "@supabase/supabase-js";

// No credentials are hard-coded here any more. Configure them through environment variables
// (see .env.example). The Supabase URL and the publishable (anon) key are public by design and are
// exposed to the browser via NEXT_PUBLIC_*; the secret/service-role key is server-only.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";

const SUPABASE_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

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

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET);
}

let warnedNotConfigured = false;

/**
 * Server-only admin Supabase client (bypasses Row Level Security).
 *
 * It used to silently fall back to the publishable (anon) key when no valid secret key was set,
 * which "worked" only because the database had been opened to the public role. It now always uses
 * the real secret key so Row Level Security can (and must) stay locked down.
 *
 * If the secret key is missing we do NOT throw (many call sites sit outside try/catch and the app is
 * designed to keep working from its local store): we log loudly once and return a client pointed at
 * a dead address, so every cloud call fails fast into the existing "sync failed" handling.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  if (!isSupabaseConfigured()) {
    if (!warnedNotConfigured) {
      warnedNotConfigured = true;
      console.error(
        "[Supabase] SUPABASE_URL / SUPABASE_SECRET_KEY are not configured. Running in LOCAL-ONLY mode: data is NOT being saved to Supabase."
      );
    }
    adminClient = createClient("http://127.0.0.1:9", "supabase-not-configured", {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return adminClient;
  }

  adminClient = createClient(SUPABASE_URL, SUPABASE_SECRET, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return adminClient;
}
