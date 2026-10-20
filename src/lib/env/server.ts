import "server-only";

import { z } from "zod";

import { isValidTimeZone } from "@/lib/validation/timezone";

import { emptyToUndefined, parseEnv } from "./parse";

/**
 * Server-only configuration. Importing this module from a Client Component fails the build
 * (`server-only`), which keeps secrets out of browser bundles.
 *
 * Each getter validates only what its feature needs, so optional/future-phase integrations do not
 * break the base application when they are not configured.
 */

const serviceRoleSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "looks too short to be a Supabase key"),
});

const schedulingSchema = z.object({
  CONSULTATION_TIMEZONE: z
    .string()
    .refine(isValidTimeZone, "must be a valid IANA timezone such as Asia/Kolkata"),
});

const lookupSchema = z.object({
  APPOINTMENT_LOOKUP_SECRET: z.string().min(32, "must be at least 32 characters"),
});

/** Service-role key. Bypasses RLS — callers must authorize and validate before using it. */
export function getServiceRoleKey(): string {
  return parseEnv("Supabase service role", serviceRoleSchema, {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }).SUPABASE_SERVICE_ROLE_KEY;
}

/** Client-approved consultation timezone (Phase 5+). */
export function getConsultationTimeZone(): string {
  return parseEnv("scheduling", schedulingSchema, {
    CONSULTATION_TIMEZONE: process.env.CONSULTATION_TIMEZONE,
  }).CONSULTATION_TIMEZONE;
}

/** Secret for signing appointment lookup tokens (Phase 7). */
export function getAppointmentLookupSecret(): string {
  return parseEnv("appointment lookup", lookupSchema, {
    APPOINTMENT_LOOKUP_SECRET: process.env.APPOINTMENT_LOOKUP_SECRET,
  }).APPOINTMENT_LOOKUP_SECRET;
}

/** Email provider key, or `null` when email notifications are not enabled (Phase 12). */
export function getResendApiKey(): string | null {
  return emptyToUndefined(process.env.RESEND_API_KEY) ?? null;
}
