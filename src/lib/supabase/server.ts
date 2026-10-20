import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicEnv } from "@/lib/env/public";
import type { Database } from "@/types/database.types";

/**
 * Request-scoped Supabase client acting as the signed-in user (or anon). RLS applies.
 * Use for admin pages/actions (Phase 8+). Reads cookies, so callers must render inside a
 * <Suspense> boundary under Cache Components.
 */
export async function createSupabaseServerClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only. Session refresh will be
          // handled in proxy.ts when admin auth is implemented (Phase 8).
        }
      },
    },
  });
}
