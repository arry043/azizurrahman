import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { E164_PATTERN } from "@/lib/validation/contact";
import type { Database } from "@/types/database.types";
import type { SiteSettingsRow } from "@/types/domain";

export const settingsInputSchema = z.object({
  booking_horizon_days: z.coerce
    .number()
    .int()
    .min(1, "Booking horizon must be at least 1 day")
    .max(365, "Booking horizon cannot exceed 365 days"),
  min_advance_notice_minutes: z.coerce
    .number()
    .int()
    .min(0, "Notice cannot be negative")
    .max(43200, "Notice cannot exceed 30 days (43,200 mins)"),
  slot_interval_minutes: z.coerce
    .number()
    .int()
    .min(5, "Slot interval must be at least 5 minutes")
    .max(240, "Slot interval cannot exceed 240 minutes"),
  public_phone: z
    .string()
    .trim()
    .refine(
      (v) => !v || E164_PATTERN.test(v),
      "Phone number must be in international E.164 format (e.g. +919876543210)",
    )
    .nullable()
    .optional(),
  public_whatsapp: z
    .string()
    .trim()
    .refine(
      (v) => !v || E164_PATTERN.test(v),
      "WhatsApp number must be in international E.164 format (e.g. +919876543210)",
    )
    .nullable()
    .optional(),
  public_email: z
    .string()
    .trim()
    .email("Must be a valid email address")
    .max(254)
    .nullable()
    .optional()
    .or(z.literal("")),
  public_address: z
    .string()
    .trim()
    .max(500, "Address cannot exceed 500 characters")
    .nullable()
    .optional(),
  consultation_hours_text: z
    .string()
    .trim()
    .max(500, "Hours text cannot exceed 500 characters")
    .nullable()
    .optional(),
  whatsapp_message_template: z
    .string()
    .trim()
    .max(500, "Template cannot exceed 500 characters")
    .nullable()
    .optional(),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;

/**
 * Retrieves the singleton site settings row.
 */
export async function getAdminSiteSettings(
  supabase: SupabaseClient<Database>,
): Promise<SiteSettingsRow> {
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", true).single();

  if (error || !data) {
    logger.error("get_admin_site_settings_failed", { error: error?.message });
    throw new AppError("INTERNAL_ERROR", {
      publicMessage: "Failed to retrieve site settings.",
    });
  }

  return data;
}

/**
 * Updates site settings.
 */
export async function updateAdminSiteSettings(
  supabase: SupabaseClient<Database>,
  input: SettingsInput,
): Promise<SiteSettingsRow> {
  const validated = settingsInputSchema.parse(input);

  const { data, error } = await supabase
    .from("site_settings")
    .update({
      booking_horizon_days: validated.booking_horizon_days,
      min_advance_notice_minutes: validated.min_advance_notice_minutes,
      slot_interval_minutes: validated.slot_interval_minutes,
      public_phone: validated.public_phone || null,
      public_whatsapp: validated.public_whatsapp || null,
      public_email: validated.public_email ? validated.public_email.toLowerCase() : null,
      public_address: validated.public_address || null,
      consultation_hours_text: validated.consultation_hours_text || null,
      whatsapp_message_template: validated.whatsapp_message_template || null,
    })
    .eq("id", true)
    .select()
    .single();

  if (error || !data) {
    logger.error("update_admin_site_settings_failed", { error: error?.message });
    throw new AppError("INTERNAL_ERROR", {
      publicMessage: error?.message || "Failed to update site settings.",
    });
  }

  logger.info("site_settings_updated");
  return data;
}
