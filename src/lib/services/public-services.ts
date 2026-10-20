import "server-only";

import { logger } from "@/lib/logger";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { PublicService, SiteSettingsRow } from "@/types/domain";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

/**
 * Fetches all active services in configured display order.
 * Safe for anonymous public pages. If the database is unreachable
 * or unconfigured, returns an empty list without throwing.
 */
export async function getActiveServices(): Promise<PublicService[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("services")
      .select("id, slug, name, short_description, description, image_url, duration_minutes")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      logger.error("Failed to fetch public active services", {
        code: error.code,
        message: error.message,
      });
      return [];
    }

    return (data as PublicService[]) ?? [];
  } catch (err) {
    logger.error("Database client error in getActiveServices", {
      message: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

/**
 * Fetches a single active service by slug.
 * Returns null if the service does not exist or is inactive.
 */
export async function getActiveServiceBySlug(slug: string): Promise<PublicService | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("services")
      .select("id, slug, name, short_description, description, image_url, duration_minutes")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      logger.error("Failed to fetch service by slug", {
        slug,
        code: error.code,
        message: error.message,
      });
      return null;
    }

    return (data as PublicService) ?? null;
  } catch (err) {
    logger.error("Database client error in getActiveServiceBySlug", {
      slug,
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export type PublicSiteSettings = Pick<
  SiteSettingsRow,
  | "public_phone"
  | "public_whatsapp"
  | "public_email"
  | "public_address"
  | "consultation_hours_text"
  | "whatsapp_message_template"
  | "booking_horizon_days"
  | "min_advance_notice_minutes"
>;

/**
 * Fetches public non-secret site settings.
 * Returns null if unpopulated or unreachable.
 */
export async function getPublicSiteSettings(): Promise<PublicSiteSettings | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select(
        "public_phone, public_whatsapp, public_email, public_address, consultation_hours_text, whatsapp_message_template, booking_horizon_days, min_advance_notice_minutes",
      )
      .maybeSingle();

    if (error) {
      logger.error("Failed to fetch public site settings", {
        code: error.code,
        message: error.message,
      });
      return null;
    }

    return (data as PublicSiteSettings) ?? null;
  } catch (err) {
    logger.error("Database client error in getPublicSiteSettings", {
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
