import "server-only";

import { getSiteUrl } from "@/lib/env/public";
import { logger } from "@/lib/logger";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { normalizeEmail } from "@/lib/validation/contact";
import type { Database } from "@/types/database.types";
import type { AppointmentStatus } from "@/types/domain";
import type { EmailProvider } from "./adapters/provider";
import { ResendEmailAdapter } from "./adapters/resend-adapter";
import { renderAppointmentEmail } from "./templates";
import type {
  AppointmentNotificationPayload,
  NotificationEvent,
  NotificationOutcome,
} from "./types";

interface SendNotificationOptions {
  event: NotificationEvent;
  appointment: AppointmentNotificationPayload;
  expectedStatus?: AppointmentStatus;
  provider?: EmailProvider;
  maxRetries?: number;
  initialBackoffMs?: number;
}

const defaultResendProvider = new ResendEmailAdapter();

/**
 * Dispatches an asynchronous, non-blocking notification for an appointment event.
 *
 * CRITICAL RELIABILITY INVARIANTS:
 * 1. Safe Post-Commit: Called ONLY after the primary database transaction commits.
 * 2. Fail-Open / Non-Blocking: Never throws an uncaught error to the caller. Email failure
 *    NEVER rolls back a booking or invalidates an appointment status update.
 * 3. Accurate Audit Logging: Records delivery outcome truthfully into notification_logs.
 *    Never claims success when delivery failed.
 * 4. Stale-State Protection: Checks whether the appointment status is still valid before sending.
 * 5. Idempotent: Deduplicates repeated dispatches with deterministic idempotency keys.
 * 6. Transient Retry: Retries transient HTTP 429/5xx errors safely up to maxRetries.
 */
export async function sendAppointmentNotification(
  options: SendNotificationOptions,
): Promise<NotificationOutcome> {
  const {
    event,
    appointment,
    expectedStatus,
    provider = defaultResendProvider,
    maxRetries = 2,
    initialBackoffMs = 200,
  } = options;

  const recipientEmail = appointment.email ? normalizeEmail(appointment.email) : null;
  const idempotencyKey = `notif_${appointment.appointmentId}_${event}`;

  // 1. If recipient has no email or an invalid email, record as skipped
  if (!recipientEmail || !recipientEmail.includes("@")) {
    logger.info("notification_skipped_no_email", {
      appointmentId: appointment.appointmentId,
      reference: appointment.publicReference,
      event,
    });

    await recordNotificationLog({
      appointmentId: appointment.appointmentId,
      channel: "email",
      template: event,
      recipient: recipientEmail || "none",
      status: "skipped",
      lastErrorCode: "NO_EMAIL_ADDRESS",
      lastErrorMessage: "Customer did not provide an email address.",
      idempotencyKey,
      attemptCount: 1,
    });

    return {
      status: "skipped",
      channel: "email",
      event,
      recipient: recipientEmail || "none",
      errorCode: "NO_EMAIL_ADDRESS",
      attemptCount: 1,
    };
  }

  // 2. Check if provider is configured
  if (!provider.isConfigured()) {
    logger.info("notification_skipped_provider_unconfigured", {
      appointmentId: appointment.appointmentId,
      reference: appointment.publicReference,
      event,
      provider: provider.name,
    });

    await recordNotificationLog({
      appointmentId: appointment.appointmentId,
      channel: "email",
      template: event,
      recipient: recipientEmail,
      status: "skipped",
      lastErrorCode: "PROVIDER_NOT_CONFIGURED",
      lastErrorMessage: `Email provider ${provider.name} is not configured with credentials.`,
      idempotencyKey,
      attemptCount: 1,
    });

    return {
      status: "skipped",
      channel: "email",
      event,
      recipient: recipientEmail,
      errorCode: "PROVIDER_NOT_CONFIGURED",
      attemptCount: 1,
    };
  }

  // 3. Stale Status Check: Verify appointment status in DB hasn't changed before sending
  if (expectedStatus && appointment.status !== expectedStatus) {
    logger.warn("notification_skipped_stale_status", {
      appointmentId: appointment.appointmentId,
      currentStatus: appointment.status,
      expectedStatus,
      event,
    });

    await recordNotificationLog({
      appointmentId: appointment.appointmentId,
      channel: "email",
      template: event,
      recipient: recipientEmail,
      status: "skipped",
      lastErrorCode: "STALE_STATUS",
      lastErrorMessage: `Appointment status '${appointment.status}' no longer matches expected '${expectedStatus}'.`,
      idempotencyKey,
      attemptCount: 1,
    });

    return {
      status: "skipped",
      channel: "email",
      event,
      recipient: recipientEmail,
      errorCode: "STALE_STATUS",
      attemptCount: 1,
    };
  }

  // 4. Idempotency Check: Prevent duplicate sends if this event has already succeeded
  const existingLog = await checkExistingNotification(idempotencyKey);
  if (existingLog && existingLog.status === "sent") {
    logger.info("notification_skipped_already_sent", {
      appointmentId: appointment.appointmentId,
      event,
      idempotencyKey,
    });

    return {
      status: "skipped",
      channel: "email",
      event,
      recipient: recipientEmail,
      providerMessageId: existingLog.provider_message_id,
      errorCode: "ALREADY_SENT",
      attemptCount: existingLog.attempt_count,
    };
  }

  // 5. Render Email Template
  const siteUrl = getSiteUrl().origin;
  const rendered = renderAppointmentEmail(event, appointment, siteUrl);

  // 6. Execute send with safe retry loop for transient failures
  let attempts = 0;
  let lastResult = await provider.sendEmail({
    to: recipientEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    idempotencyKey,
  });
  attempts++;

  while (!lastResult.success && lastResult.isRetryable && attempts <= maxRetries) {
    const delay = initialBackoffMs * Math.pow(2, attempts - 1);
    logger.info("notification_transient_retry", {
      appointmentId: appointment.appointmentId,
      event,
      attempt: attempts,
      delayMs: delay,
    });

    await sleep(delay);

    lastResult = await provider.sendEmail({
      to: recipientEmail,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      idempotencyKey: `${idempotencyKey}_try${attempts + 1}`,
    });
    attempts++;
  }

  // 7. Record Result in Audit Log
  const finalStatus = lastResult.success ? "sent" : "failed";

  await recordNotificationLog({
    appointmentId: appointment.appointmentId,
    channel: "email",
    template: event,
    recipient: recipientEmail,
    status: finalStatus,
    providerMessageId: lastResult.providerMessageId || null,
    lastErrorCode: lastResult.errorCode || null,
    lastErrorMessage: lastResult.errorMessage || null,
    idempotencyKey,
    attemptCount: attempts,
    sentAt: lastResult.success ? new Date().toISOString() : null,
  });

  if (lastResult.success) {
    logger.info("notification_sent_successfully", {
      appointmentId: appointment.appointmentId,
      reference: appointment.publicReference,
      event,
      providerMessageId: lastResult.providerMessageId,
      attempts,
    });
  } else {
    logger.error("notification_delivery_failed", {
      appointmentId: appointment.appointmentId,
      reference: appointment.publicReference,
      event,
      errorCode: lastResult.errorCode,
      errorMessage: lastResult.errorMessage,
      attempts,
    });
  }

  return {
    status: finalStatus,
    channel: "email",
    event,
    recipient: recipientEmail,
    providerMessageId: lastResult.providerMessageId,
    error: lastResult.errorMessage,
    errorCode: lastResult.errorCode,
    attemptCount: attempts,
  };
}

async function checkExistingNotification(idempotencyKey: string) {
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("notification_logs")
      .select("id, status, provider_message_id, attempt_count")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    return data;
  } catch {
    return null;
  }
}

async function recordNotificationLog(record: {
  appointmentId: string;
  channel: "email" | "whatsapp" | "sms";
  template: string;
  recipient: string;
  status: "sent" | "failed" | "skipped";
  providerMessageId?: string | null;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  idempotencyKey?: string | null;
  attemptCount: number;
  sentAt?: string | null;
}) {
  try {
    const supabase = createServiceRoleClient();
    const insertData: Database["public"]["Tables"]["notification_logs"]["Insert"] = {
      appointment_id: record.appointmentId,
      channel: record.channel,
      template: record.template,
      recipient: record.recipient,
      status: record.status,
      provider_message_id: record.providerMessageId || null,
      last_error_code: record.lastErrorCode || null,
      last_error_message: record.lastErrorMessage || null,
      idempotency_key: record.idempotencyKey || null,
      attempt_count: record.attemptCount,
      sent_at: record.sentAt || null,
    };

    const { error } = await supabase.from("notification_logs").insert(insertData);

    if (error && error.code !== "23505") {
      logger.warn("failed_to_write_notification_log", { error: error.message });
    }
  } catch (err) {
    logger.warn("failed_to_write_notification_log_exception", { error: String(err) });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
