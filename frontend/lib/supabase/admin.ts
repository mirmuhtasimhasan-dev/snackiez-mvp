import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with the service role key. Used to store
 * review photos from customers, who are not signed in: the server checks
 * the order first, then uploads on their behalf. Returns null when
 * SUPABASE_SERVICE_ROLE_KEY is not set (photo upload is then turned off).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
