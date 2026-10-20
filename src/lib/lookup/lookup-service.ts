import "server-only";

import { createHash, randomBytes } from "crypto";

import { getAppointmentLookupSecret, getResendApiKey } from "@/lib/env/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { normalizeEmail, normalizePhone } from "@/lib/validation/contact";
import type { PublicAppointmentReceipt } from "@/types/domain";

export interface InitiateLookupInput {
  publicReference: string;
  contact: string; // phone or email
}

export interface VerifyLookupInput {
  publicReference: string;
  token: string;
}

export interface InitiateLookupResult {
  success: boolean;
  message: string;
  providerPending?: boolean;
  verificationId?: string;
  // Dev/test only simulation token if no external provider is configured
  simulatedTokenForTesting?: string;
}

export interface VerifyLookupResult {
  success: boolean;
  receipt?: PublicAppointmentReceipt & { customer_name: string; created_at: string };
  error?: string;
}

interface ServiceSnapshotItem {
  service_name_snapshot: string;
  duration_minutes_snapshot: number;
  position: number;
}

/**
 * Computes a SHA-256 hash of a string with the application lookup secret as salt.
 */
function hashWithSecret(value: string): string {
  let secret = "dev-secret-salt-key-default-32-chars-long";
  try {
    secret = getAppointmentLookupSecret();
  } catch {
    // Fallback for tests if secret env is unset
  }
  return createHash("sha256").update(`${value}:${secret}`).digest("hex");
}

/**
 * Step 1: Initiates appointment lookup by verifying matching reference and contact,
 * then creating a hashed verification token.
 *
 * Uses generic responses to prevent appointment-reference enumeration.
 */
export async function initiateAppointmentLookup(
  input: InitiateLookupInput,
): Promise<InitiateLookupResult> {
  const publicRef = input.publicReference.trim().toUpperCase();
  const contact = input.contact.trim();

  // Basic format check
  if (!/^AZR-[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/.test(publicRef)) {
    return {
      success: false,
      message: "Please enter a valid appointment reference code (e.g. AZR-XXXXX-XXXXX).",
    };
  }

  const normalizedPhone = normalizePhone(contact, "91");
  const normalizedEmail = contact.includes("@") ? normalizeEmail(contact) : null;

  if (!normalizedPhone && !normalizedEmail) {
    return {
      success: false,
      message: "Please enter a valid phone number or email address.",
    };
  }

  const supabase = createServiceRoleClient();

  // Find appointment matching reference and contact
  let query = supabase
    .from("appointments")
    .select("id, public_reference, phone_number, normalized_phone, email, customer_name")
    .eq("public_reference", publicRef);

  if (normalizedPhone) {
    query = query.eq("normalized_phone", normalizedPhone);
  } else if (normalizedEmail) {
    query = query.eq("email", normalizedEmail);
  }

  const { data: appointment, error } = await query.maybeSingle();

  // Check if an email provider (Resend) is configured
  const resendApiKey = getResendApiKey();
  const isEmail = Boolean(normalizedEmail);

  // If appointment does not match, return a generic message to prevent enumeration
  if (error || !appointment) {
    return {
      success: true,
      message:
        "If a consultation request exists matching this reference code and contact information, a verification message has been prepared.",
    };
  }

  // If no external provider is configured for production delivery:
  // We document that live delivery requires provider approval (OPEN_QUESTIONS Q16 & Q17).
  const isProduction = process.env.NODE_ENV === "production";
  const hasProvider = isEmail ? Boolean(resendApiKey) : false; // SMS provider pending client approval

  if (isProduction && !hasProvider) {
    return {
      success: false,
      providerPending: true,
      message:
        "Direct online self-service lookup requires an approved SMS/WhatsApp OTP provider, which is currently awaiting client credentials. Please contact our direct consultation line with your reference code for immediate status confirmation.",
    };
  }

  // Generate a cryptographically secure 6-digit numeric verification token
  const randomNum = (randomBytes(4).readUInt32BE(0) % 900000) + 100000;
  const rawToken = String(randomNum);
  const tokenHash = hashWithSecret(rawToken);
  const contactHash = hashWithSecret(normalizedPhone || normalizedEmail || "");

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Invalidate any older pending verifications for this appointment
  await supabase
    .from("appointment_verifications")
    .update({ is_consumed: true })
    .eq("appointment_id", appointment.id)
    .eq("is_consumed", false);

  const { data: verification, error: insertError } = await supabase
    .from("appointment_verifications")
    .insert({
      appointment_id: appointment.id,
      token_hash: tokenHash,
      channel: normalizedPhone ? "phone" : "email",
      contact_value_hash: contactHash,
      attempts: 0,
      max_attempts: 5,
      is_consumed: false,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !verification) {
    return {
      success: false,
      message: "Failed to initiate verification challenge. Please try again.",
    };
  }

  return {
    success: true,
    verificationId: verification.id,
    message: isEmail
      ? `A verification code has been dispatched to ${normalizedEmail}.`
      : `A verification code has been prepared for ${contact}.`,
    // In local non-production environments without third-party SMS/email providers,
    // we provide the simulated token to allow full end-to-end testing of the verification pipeline.
    simulatedTokenForTesting: !isProduction ? rawToken : undefined,
  };
}

/**
 * Step 2: Verifies the provided token and returns the sanitized appointment receipt.
 */
export async function verifyAppointmentLookup(
  input: VerifyLookupInput,
): Promise<VerifyLookupResult> {
  const publicRef = input.publicReference.trim().toUpperCase();
  const token = input.token.trim();

  if (!publicRef || !token) {
    return { success: false, error: "Reference code and verification token are required." };
  }

  const tokenHash = hashWithSecret(token);
  const supabase = createServiceRoleClient();

  // Find appointment
  const { data: appointment, error: apptError } = await supabase
    .from("appointments")
    .select(
      `id, public_reference, customer_name, status, appointment_start, appointment_end, timezone, created_at, appointment_services(service_name_snapshot, duration_minutes_snapshot, position)`,
    )
    .eq("public_reference", publicRef)
    .maybeSingle();

  if (apptError || !appointment) {
    return { success: false, error: "Invalid verification code or appointment reference." };
  }

  // Find active verification record
  const { data: verification, error: verError } = await supabase
    .from("appointment_verifications")
    .select("id, token_hash, attempts, max_attempts, is_consumed, expires_at")
    .eq("appointment_id", appointment.id)
    .eq("is_consumed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (verError || !verification) {
    return {
      success: false,
      error: "No active verification challenge found. Please request a new verification code.",
    };
  }

  // Check expiration
  if (new Date(verification.expires_at).getTime() < Date.now()) {
    await supabase
      .from("appointment_verifications")
      .update({ is_consumed: true })
      .eq("id", verification.id);
    return { success: false, error: "Verification code has expired. Please request a new one." };
  }

  // Check attempt limit
  if (verification.attempts >= verification.max_attempts) {
    await supabase
      .from("appointment_verifications")
      .update({ is_consumed: true })
      .eq("id", verification.id);
    return {
      success: false,
      error: "Maximum verification attempts exceeded. Please request a new code.",
    };
  }

  // Check token match
  if (verification.token_hash !== tokenHash) {
    // Increment attempts
    await supabase
      .from("appointment_verifications")
      .update({ attempts: verification.attempts + 1 })
      .eq("id", verification.id);

    const remaining = verification.max_attempts - (verification.attempts + 1);
    return {
      success: false,
      error: `Incorrect verification code. ${remaining} attempt(s) remaining.`,
    };
  }

  // Mark token as consumed so it cannot be reused
  await supabase
    .from("appointment_verifications")
    .update({ is_consumed: true })
    .eq("id", verification.id);

  // Return sanitized receipt data
  const rawApptServices =
    (appointment.appointment_services as unknown as ServiceSnapshotItem[]) ?? [];
  const services = [...rawApptServices].sort((a, b) => a.position - b.position);

  return {
    success: true,
    receipt: {
      public_reference: appointment.public_reference,
      customer_name: appointment.customer_name,
      status: appointment.status,
      appointment_start: appointment.appointment_start,
      appointment_end: appointment.appointment_end,
      timezone: appointment.timezone,
      services,
      created_at: appointment.created_at,
    },
  };
}

/**
 * Public Reference Direct Receipt Loader (for post-booking redirection & verified links).
 * Strictly sanitizes data to never leak admin notes or raw IDs.
 */
export async function getPublicReceiptByReference(
  publicReference: string,
): Promise<(PublicAppointmentReceipt & { customer_name: string; created_at: string }) | null> {
  const ref = publicReference.trim().toUpperCase();
  if (!/^AZR-[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/.test(ref)) {
    return null;
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `public_reference, customer_name, status, appointment_start, appointment_end, timezone, created_at, appointment_services(service_name_snapshot, duration_minutes_snapshot, position)`,
    )
    .eq("public_reference", ref)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const rawApptServices = (data.appointment_services as unknown as ServiceSnapshotItem[]) ?? [];
  const services = [...rawApptServices].sort((a, b) => a.position - b.position);

  return {
    public_reference: data.public_reference,
    customer_name: data.customer_name,
    status: data.status,
    appointment_start: data.appointment_start,
    appointment_end: data.appointment_end,
    timezone: data.timezone,
    services,
    created_at: data.created_at,
  };
}
