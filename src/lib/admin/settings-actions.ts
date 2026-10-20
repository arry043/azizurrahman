"use server";

import { revalidatePath } from "next/cache";

import { type SettingsInput, updateAdminSiteSettings } from "@/lib/admin/settings-admin-service";
import { requireAdminAuth } from "@/lib/auth/admin-auth";

export type SettingsActionResult = {
  success: boolean;
  error?: string;
};

export async function updateSiteSettingsAction(
  input: SettingsInput,
): Promise<SettingsActionResult> {
  try {
    const { supabase } = await requireAdminAuth({ redirectToLogin: false });
    await updateAdminSiteSettings(supabase, input);

    revalidatePath("/admin/settings");
    revalidatePath("/admin/availability");
    revalidatePath("/contact");
    revalidatePath("/book");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update site settings.";
    return { success: false, error: msg };
  }
}
