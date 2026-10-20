import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { generateSlug } from "@/lib/admin/slug-utils";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { Database } from "@/types/database.types";
import type { ServiceRow } from "@/types/domain";

export { generateSlug };

export const serviceInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or fewer"),
  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    )
    .max(80, "Slug must be 80 characters or fewer"),
  short_description: z
    .string()
    .trim()
    .max(280, "Short description must be 280 characters or fewer")
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .max(10000, "Description must be 10,000 characters or fewer")
    .nullable()
    .optional(),
  image_url: z
    .string()
    .trim()
    .regex(/^(https:\/\/|\/)/, "Image URL must start with https:// or /")
    .max(2048)
    .nullable()
    .optional()
    .or(z.literal("")),
  duration_minutes: z.coerce
    .number()
    .int()
    .min(1, "Duration must be at least 1 minute")
    .max(720, "Duration cannot exceed 720 minutes (12 hours)"),
  buffer_before_minutes: z.coerce
    .number()
    .int()
    .min(0, "Buffer before cannot be negative")
    .max(240, "Buffer before cannot exceed 240 minutes")
    .default(0),
  buffer_after_minutes: z.coerce
    .number()
    .int()
    .min(0, "Buffer after cannot be negative")
    .max(240, "Buffer after cannot exceed 240 minutes")
    .default(0),
  display_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(false),
});

export type ServiceInput = z.infer<typeof serviceInputSchema>;

/**
 * Retrieves all services (both active and archived), ordered by display_order.
 */
export async function getAdminServices(supabase: SupabaseClient<Database>): Promise<ServiceRow[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    logger.error("get_admin_services_failed", { error: error.message });
    throw new AppError("INTERNAL_ERROR", {
      publicMessage: "Failed to retrieve services.",
    });
  }

  return data || [];
}

/**
 * Retrieves a single service by ID.
 */
export async function getAdminServiceById(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<ServiceRow | null> {
  const { data, error } = await supabase.from("services").select("*").eq("id", id).maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Creates a new service.
 */
export async function createAdminService(
  supabase: SupabaseClient<Database>,
  input: ServiceInput,
): Promise<ServiceRow> {
  const validated = serviceInputSchema.parse(input);

  const { data, error } = await supabase
    .from("services")
    .insert({
      name: validated.name,
      slug: validated.slug,
      short_description: validated.short_description || null,
      description: validated.description || null,
      image_url: validated.image_url || null,
      duration_minutes: validated.duration_minutes,
      buffer_before_minutes: validated.buffer_before_minutes,
      buffer_after_minutes: validated.buffer_after_minutes,
      display_order: validated.display_order,
      is_active: validated.is_active,
    })
    .select()
    .single();

  if (error || !data) {
    logger.error("create_admin_service_failed", { error: error?.message, slug: validated.slug });
    if (error?.code === "23505") {
      throw new AppError("VALIDATION_FAILED", {
        publicMessage: "A service with this slug already exists.",
      });
    }
    throw new AppError("INTERNAL_ERROR", {
      publicMessage: error?.message || "Failed to create service.",
    });
  }

  logger.info("service_created", { id: data.id, slug: data.slug });
  return data;
}

/**
 * Updates an existing service.
 * Note: Historical appointment snapshots are not touched, preserving booking integrity.
 */
export async function updateAdminService(
  supabase: SupabaseClient<Database>,
  id: string,
  input: Partial<ServiceInput>,
): Promise<ServiceRow> {
  const updates: Database["public"]["Tables"]["services"]["Update"] = {};

  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.slug !== undefined) updates.slug = input.slug.trim();
  if (input.short_description !== undefined)
    updates.short_description = input.short_description?.trim() || null;
  if (input.description !== undefined) updates.description = input.description?.trim() || null;
  if (input.image_url !== undefined) updates.image_url = input.image_url?.trim() || null;
  if (input.duration_minutes !== undefined) updates.duration_minutes = input.duration_minutes;
  if (input.buffer_before_minutes !== undefined)
    updates.buffer_before_minutes = input.buffer_before_minutes;
  if (input.buffer_after_minutes !== undefined)
    updates.buffer_after_minutes = input.buffer_after_minutes;
  if (input.display_order !== undefined) updates.display_order = input.display_order;
  if (input.is_active !== undefined) updates.is_active = input.is_active;

  const { data, error } = await supabase
    .from("services")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    logger.error("update_admin_service_failed", { error: error?.message, id });
    if (error?.code === "23505") {
      throw new AppError("VALIDATION_FAILED", {
        publicMessage: "A service with this slug already exists.",
      });
    }
    throw new AppError("INTERNAL_ERROR", {
      publicMessage: error?.message || "Failed to update service.",
    });
  }

  logger.info("service_updated", { id, slug: data.slug });
  return data;
}

/**
 * Toggles a service's active status.
 */
export async function toggleServiceActive(
  supabase: SupabaseClient<Database>,
  id: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await supabase.from("services").update({ is_active: isActive }).eq("id", id);

  if (error) {
    logger.error("toggle_service_active_failed", { error: error.message, id });
    throw new AppError("INTERNAL_ERROR", {
      publicMessage: "Failed to update service active status.",
    });
  }

  logger.info("service_active_toggled", { id, isActive });
}

/**
 * Reorders services by updating their display_order values sequentially.
 */
export async function reorderServices(
  supabase: SupabaseClient<Database>,
  serviceIds: string[],
): Promise<void> {
  for (let i = 0; i < serviceIds.length; i++) {
    const serviceId = serviceIds[i];
    if (!serviceId) continue;

    const displayOrder = (i + 1) * 10;
    const { error } = await supabase
      .from("services")
      .update({ display_order: displayOrder })
      .eq("id", serviceId);

    if (error) {
      logger.error("reorder_services_failed", { error: error.message, serviceId });
      throw new AppError("INTERNAL_ERROR", {
        publicMessage: "Failed to reorder services.",
      });
    }
  }

  logger.info("services_reordered", { count: serviceIds.length });
}

/**
 * Deletes a service if never booked.
 * Throws user-friendly error if restricted by foreign key in appointment_services.
 */
export async function deleteAdminService(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("services").delete().eq("id", id);

  if (error) {
    // 23503 is foreign_key_violation in Postgres
    if (error.code === "23503" || error.message.includes("violates foreign key constraint")) {
      throw new AppError("FORBIDDEN", {
        publicMessage:
          "This service has historical bookings and cannot be deleted. Deactivate it instead so it will not appear for new bookings while preserving historical records.",
      });
    }

    logger.error("delete_admin_service_failed", { error: error.message, id });
    throw new AppError("INTERNAL_ERROR", {
      publicMessage: "Failed to delete service.",
    });
  }

  logger.info("service_deleted", { id });
}
