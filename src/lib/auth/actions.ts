"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Please enter your password"),
});

export type LoginActionState = {
  success: boolean;
  error?: string;
};

/**
 * Server action to sign in an administrator.
 * Validates credentials and verifies that the user is an active administrator.
 */
export async function loginAdminAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return {
      success: false,
      error: firstError || "Invalid email or password",
    };
  }

  const { email, password } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    logger.warn("admin_login_failed", {
      reason: "invalid_credentials",
    });
    return {
      success: false,
      error: "Invalid email or password. Please try again.",
    };
  }

  // Active admin verification against admin_profiles (enforced by RLS)
  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("id, is_active")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active) {
    logger.warn("admin_login_rejected_inactive_or_missing_profile", {
      userId: authData.user.id,
    });
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Access denied. Your account is not authorized as an administrator.",
    };
  }

  logger.info("admin_login_successful", {
    userId: authData.user.id,
  });

  redirect("/admin");
}

/**
 * Server action to sign out the current administrator.
 */
export async function logoutAdminAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
