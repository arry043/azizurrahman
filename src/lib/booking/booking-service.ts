import "server-only";

import { createHash } from "crypto";

import {
  calculateCandidateSlotsForDate,
  calculateServiceAggregation,
  ExistingAppointmentRange,
  resolveWorkingHoursForDate,
  WorkingInterval,
} from "@/lib/availability/availability-service";
import {
  addDays,
  addMinutes,
  getTodayDateStr,
  isAfterDate,
  isBeforeDate,
  localToUtc,
} from "@/lib/availability/date-utils";
import { getConsultationTimeZone } from "@/lib/env/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { normalizeEmail, normalizePhone } from "@/lib/validation/contact";
import type { ContactMethod, PublicAppointmentReceipt } from "@/types/domain";

export interface CreateBookingInput {
  customerName: string;
  phoneNumber: string;
  email?: string | null;
  preferredContactMethod?: ContactMethod | null;
  message?: string | null;
  serviceIds: string[];
  dateStr: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  idempotencyKey?: string | null;
}

export interface BookingResult {
  success: boolean;
  receipt?: PublicAppointmentReceipt & { customer_name: string; created_at: string };
  error?: string;
  code?: string;
}

/**
 * Computes a deterministic SHA-256 hash of the canonical booking parameters.
 */
function computeRequestHash(input: CreateBookingInput, normalizedPhone: string): string {
  const canonical = JSON.stringify({
    name: input.customerName.trim(),
    phone: normalizedPhone,
    date: input.dateStr,
    time: input.startTime,
    services: [...input.serviceIds].sort(),
  });
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Authoritative Server-side booking creation operation.
 * Performs rigorous multi-layer validation before calling the atomic database RPC.
 */
export async function createGuestBooking(
  input: CreateBookingInput,
  referenceTime: Date = new Date(),
): Promise<BookingResult> {
  const timeZone = getConsultationTimeZone();

  // 1. Basic field validation
  const customerName = input.customerName.trim();
  if (customerName.length < 1 || customerName.length > 120) {
    return {
      success: false,
      error: "Please provide a valid name between 1 and 120 characters.",
      code: "INVALID_NAME",
    };
  }

  // 2. Phone normalization (BR-20: E.164, default calling code 91 for India if no country code)
  const normalizedPhone = normalizePhone(input.phoneNumber, "91");
  if (!normalizedPhone) {
    return {
      success: false,
      error: "Please enter a valid phone number with country code (e.g. +91 98765 43210).",
      code: "INVALID_PHONE",
    };
  }

  // 3. Email normalization if provided
  let normalizedEmail: string | null = null;
  if (input.email && input.email.trim() !== "") {
    normalizedEmail = normalizeEmail(input.email);
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return {
        success: false,
        error: "Please enter a valid email address.",
        code: "INVALID_EMAIL",
      };
    }
  }

  // 4. Message length limit
  const message = input.message ? input.message.trim() : null;
  if (message && message.length > 1000) {
    return {
      success: false,
      error: "Message cannot exceed 1000 characters.",
      code: "MESSAGE_TOO_LONG",
    };
  }

  // 5. Service IDs check
  if (!input.serviceIds || input.serviceIds.length === 0) {
    return {
      success: false,
      error: "Please select at least one consultation service.",
      code: "NO_SERVICES",
    };
  }
  if (input.serviceIds.length > 5) {
    return {
      success: false,
      error: "Cannot book more than 5 services in a single session.",
      code: "TOO_MANY_SERVICES",
    };
  }

  // 6. Fast date sanity check before database queries
  const todayStr = getTodayDateStr(timeZone, referenceTime);
  if (isBeforeDate(input.dateStr, todayStr)) {
    return {
      success: false,
      error: "Cannot book an appointment for a past date.",
      code: "PAST_DATE",
    };
  }

  const supabase = createServiceRoleClient();

  // 7. Load services and site settings
  const [servicesRes, settingsRes] = await Promise.all([
    supabase.from("services").select("*").in("id", input.serviceIds).eq("is_active", true),
    supabase.from("site_settings").select("*").single(),
  ]);

  if (
    servicesRes.error ||
    !servicesRes.data ||
    servicesRes.data.length !== input.serviceIds.length
  ) {
    return {
      success: false,
      error: "One or more of the selected services is inactive or no longer available.",
      code: "INVALID_SERVICES",
    };
  }

  if (settingsRes.error || !settingsRes.data) {
    return {
      success: false,
      error: "System configuration could not be loaded. Please try again later.",
      code: "SETTINGS_ERROR",
    };
  }

  const settings = settingsRes.data;
  const services = servicesRes.data;
  const { durationMinutes, bufferBeforeMinutes, bufferAfterMinutes } =
    calculateServiceAggregation(services);

  // 8. Verify Date bounds (booking horizon)
  const horizonEndStr = addDays(todayStr, settings.booking_horizon_days);

  if (isAfterDate(input.dateStr, horizonEndStr)) {
    return {
      success: false,
      error: `Bookings are only accepted up to ${settings.booking_horizon_days} days in advance.`,
      code: "OUT_OF_HORIZON",
    };
  }

  // 8. Re-check slot availability authoritatively against schedule and existing bookings
  const [y, m, d] = input.dateStr.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();

  const [weeklyRes, weeklyIntervalsRes, overrideRes, appointmentsRes] = await Promise.all([
    supabase.from("weekly_availability").select("is_closed").eq("weekday", dayOfWeek).single(),
    supabase
      .from("weekly_availability_intervals")
      .select("start_time, end_time")
      .eq("weekday", dayOfWeek),
    supabase
      .from("date_overrides")
      .select("id, is_closed, date_override_intervals(start_time, end_time)")
      .eq("override_date", input.dateStr)
      .maybeSingle(),
    supabase
      .from("appointments")
      .select("id, blocked_start, blocked_end, status")
      .eq("local_date", input.dateStr)
      .eq("reserves_capacity", true),
  ]);

  const weeklyAvailability = new Map<number, boolean>([
    [dayOfWeek, weeklyRes.data?.is_closed ?? true],
  ]);
  const weeklyIntervals = new Map<number, WorkingInterval[]>([
    [
      dayOfWeek,
      (weeklyIntervalsRes.data ?? []).map((i) => ({
        startTime: i.start_time.slice(0, 5),
        endTime: i.end_time.slice(0, 5),
      })),
    ],
  ]);

  const dateOverrides = new Map<string, { isClosed: boolean; overrideId: string }>();
  const dateOverrideIntervals = new Map<string, WorkingInterval[]>();
  if (overrideRes.data) {
    dateOverrides.set(input.dateStr, {
      isClosed: overrideRes.data.is_closed,
      overrideId: overrideRes.data.id,
    });
    dateOverrideIntervals.set(
      overrideRes.data.id,
      (overrideRes.data.date_override_intervals ?? []).map((i) => ({
        startTime: i.start_time.slice(0, 5),
        endTime: i.end_time.slice(0, 5),
      })),
    );
  }

  const { isClosed, intervals } = resolveWorkingHoursForDate({
    dateStr: input.dateStr,
    weekday: dayOfWeek,
    weeklyAvailability,
    weeklyIntervals,
    dateOverrides,
    dateOverrideIntervals,
  });

  if (isClosed || intervals.length === 0) {
    return {
      success: false,
      error: "The provider is not taking appointments on this date.",
      code: "DATE_CLOSED",
    };
  }

  const existingAppointments: ExistingAppointmentRange[] = (appointmentsRes.data ?? []).map(
    (a) => ({
      id: a.id,
      blockedStart: new Date(a.blocked_start),
      blockedEnd: new Date(a.blocked_end),
      status: a.status,
    }),
  );

  const candidateSlots = calculateCandidateSlotsForDate({
    dateStr: input.dateStr,
    timeZone,
    workingIntervals: intervals,
    durationMinutes,
    bufferBeforeMinutes,
    bufferAfterMinutes,
    slotIntervalMinutes: settings.slot_interval_minutes,
    minAdvanceNoticeMinutes: settings.min_advance_notice_minutes,
    existingAppointments,
    referenceTime,
  });

  const isSlotAvailable = candidateSlots.some((s) => s.startTime === input.startTime);
  if (!isSlotAvailable) {
    return {
      success: false,
      error:
        "The requested time slot is no longer available or violates minimum advance notice. Please select another time.",
      code: "SLOT_UNAVAILABLE",
    };
  }

  // 9. Calculate precise UTC timestamps for the appointment and blocked ranges
  const endTimeStr = addMinutes(input.startTime, durationMinutes);
  const appointmentStartUtc = localToUtc(input.dateStr, input.startTime, timeZone);
  const appointmentEndUtc = localToUtc(input.dateStr, endTimeStr, timeZone);

  const blockedStartUtc = new Date(appointmentStartUtc.getTime() - bufferBeforeMinutes * 60 * 1000);
  const blockedEndUtc = new Date(appointmentEndUtc.getTime() + bufferAfterMinutes * 60 * 1000);

  // 10. Compute request hash for idempotency
  const requestHash = computeRequestHash(input, normalizedPhone);
  const idempotencyKey = input.idempotencyKey || null;

  // 11. Call the atomic database RPC function: private.create_guest_booking
  interface CreateGuestBookingArgs {
    p_customer_name: string;
    p_phone_number: string;
    p_normalized_phone: string;
    p_email: string | null;
    p_preferred_contact_method: string | null;
    p_message: string | null;
    p_appointment_start: string;
    p_appointment_end: string;
    p_blocked_start: string;
    p_blocked_end: string;
    p_timezone: string;
    p_service_ids: string[];
    p_idempotency_key: string | null;
    p_request_hash: string;
  }

  const rpcClient = supabase as unknown as {
    rpc: (
      fn: string,
      params: CreateGuestBookingArgs,
    ) => Promise<{
      data: unknown;
      error: { code?: string; message: string; details?: string } | null;
    }>;
  };

  const rpcResult = await rpcClient.rpc("create_guest_booking", {
    p_customer_name: customerName,
    p_phone_number: input.phoneNumber.trim(),
    p_normalized_phone: normalizedPhone,
    p_email: normalizedEmail,
    p_preferred_contact_method: input.preferredContactMethod || null,
    p_message: message,
    p_appointment_start: appointmentStartUtc.toISOString(),
    p_appointment_end: appointmentEndUtc.toISOString(),
    p_blocked_start: blockedStartUtc.toISOString(),
    p_blocked_end: blockedEndUtc.toISOString(),
    p_timezone: timeZone,
    p_service_ids: input.serviceIds,
    p_idempotency_key: idempotencyKey,
    p_request_hash: requestHash,
  });

  if (rpcResult.error) {
    const err = rpcResult.error;

    // PostgreSQL Exclusion Constraint violation: overlapping blocked range (23P01)
    if (err.code === "23P01" || err.message.includes("appointments_no_overlap")) {
      return {
        success: false,
        error:
          "This appointment slot was just reserved by another visitor. Please choose an alternate time.",
        code: "SLOT_CONFLICT",
      };
    }

    // PostgreSQL Unique Constraint violation: daily booking limit per phone (23505)
    if (
      err.code === "23505" &&
      (err.message.includes("appointments_one_active_per_phone_per_day") ||
        err.details?.includes("appointments_one_active_per_phone_per_day"))
    ) {
      return {
        success: false,
        error:
          "An active consultation request is already scheduled for this phone number on the selected date. Please choose another date or contact our consultation line.",
        code: "DAILY_LIMIT_EXCEEDED",
      };
    }

    return {
      success: false,
      error: "Unable to complete booking request. Please check your information and try again.",
      code: "BOOKING_FAILED",
    };
  }

  const receipt = rpcResult.data as unknown as PublicAppointmentReceipt & {
    customer_name: string;
    created_at: string;
  };

  return {
    success: true,
    receipt,
  };
}
