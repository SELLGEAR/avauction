import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only client using the service role key, which bypasses RLS.
// Never import this from a client component — the key must never reach the
// browser (see CLAUDE.md Security section).
export function createServiceRoleClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the server environment"
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
