import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "@/lib/env/public";
import type { Database } from "@/types/database.types";

/**
 * Cookie-less anonymous client for public, cacheable reads (active services, weekly hours, public
 * settings). RLS restricts it to exactly what an anonymous visitor may see. Safe to use inside
 * `'use cache'` functions because it does not read request data.
 */
export function createSupabasePublicClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getSupabasePublicEnv();
  return createClient<Database>(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
