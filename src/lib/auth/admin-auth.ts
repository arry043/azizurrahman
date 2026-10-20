import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { User } from "@supabase/supabase-js";

import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

export type AdminProfile = Tables<"admin_profiles">;

export interface AdminAuthSession {
  user: User;
  profile: AdminProfile;
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
}

export interface AdminAuthResult {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  profile: AdminProfile | null;
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
}

/**
 * Non-throwing admin authentication check.
 * Checks Supabase Auth session and verifies active admin profile in the database.
 */
export async function getAdminAuth(): Promise<AdminAuthResult> {
  await connection();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      profile: null,
      supabase,
    };
  }

  // Active admin verification against admin_profiles (enforced by RLS)
  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("id, display_name, role, is_active, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active) {
    return {
      isAuthenticated: true,
      isAdmin: false,
      user,
      profile: null,
      supabase,
    };
  }

  return {
    isAuthenticated: true,
    isAdmin: true,
    user,
    profile,
    supabase,
  };
}

/**
 * Enforces that the current request has an active administrator session.
 * In Server Components / Actions:
 * - If not logged in -> redirects to /admin/login
 * - If logged in but not an active admin -> redirects to /admin/login?error=forbidden
 *
 * Never trusts JWT claims or metadata alone; strictly verifies against database `admin_profiles`.
 */
export async function requireAdminAuth(options?: {
  redirectToLogin?: boolean;
}): Promise<AdminAuthSession> {
  const shouldRedirect = options?.redirectToLogin ?? true;
  const auth = await getAdminAuth();

  if (!auth.isAuthenticated || !auth.user) {
    if (shouldRedirect) {
      redirect("/admin/login");
    }
    throw new AppError("UNAUTHORIZED", {
      publicMessage: "Please sign in to access the administration panel.",
    });
  }

  if (!auth.isAdmin || !auth.profile) {
    logger.warn("unauthorized_admin_access_attempt", {
      userId: auth.user.id,
    });
    if (shouldRedirect) {
      redirect("/admin/login?error=forbidden");
    }
    throw new AppError("FORBIDDEN", {
      publicMessage: "Access denied. You do not have active administrator permissions.",
    });
  }

  return {
    user: auth.user,
    profile: auth.profile,
    supabase: auth.supabase,
  };
}
