import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

/**
 * Cookie-less anonymous client for PUBLIC, non-personalised reads (published
 * courses, classes). It never touches cookies(), so callers can be wrapped in
 * unstable_cache and do not force a page to render per-request.
 * RLS still applies: only rows readable by the anon role are returned.
 */
export function createPublicClient() {
  const env = getSupabaseEnv();
  if (!env) throw new Error("Supabase is not configured. See .env.example.");
  return createSupabaseClient(env.url, env.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Cache tag busted when courses, units or lessons change. */
export const CURRICULUM_TAG = "curriculum";
/** Safety-net TTL (seconds) in case a mutation path forgets to bust the tag. */
export const CURRICULUM_TTL = 120;
