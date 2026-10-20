import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "@/lib/env/public";
import { getServiceRoleKey } from "@/lib/env/server";
import type { Database } from "@/types/database.types";

/**
 * PRIVILEGED client — bypasses Row Level Security.
 *
 * The ONLY module allowed to read SUPABASE_SERVICE_ROLE_KEY. Use it solely from trusted server
 * operations (e.g. the Phase 6 booking operation) AFTER validating every input and authorizing the
 * caller, because the database will not do it for you. Never return raw rows from this client to
 * the browser; map them to explicit public shapes (no private_admin_notes, no internal ids).
 */
export function createSupabaseServiceRoleClient() {
  const { NEXT_PUBLIC_SUPABASE_URL } = getSupabasePublicEnv();
  return createClient<Database>(NEXT_PUBLIC_SUPABASE_URL, getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export const createServiceRoleClient = createSupabaseServiceRoleClient;
