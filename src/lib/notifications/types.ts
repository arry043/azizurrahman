import type { AppointmentStatus } from "@/types/domain";

export type NotificationChannel = "email" | "whatsapp" | "sms";

export type NotificationEvent =
  | "booking_request_received"
  | "appointment_confirmed"
  | "appointment_declined"
  | "appointment_cancelled"
  | "appointment_rescheduled";

export type NotificationDeliveryStatus = "sent" | "failed" | "skipped";

export interface NotificationServiceSnapshot {
  name: string;
  durationMinutes: number;
}

export interface AppointmentNotificationPayload {
  appointmentId: string;
  publicReference: string;
  customerName: string;
  email: string | null;
  phone: string;
  status: AppointmentStatus;
  appointmentStart: string;
  appointmentEnd: string;
  timeZone: string;
  services: NotificationServiceSnapshot[];
  reason?: string | null;
}

export interface EmailRenderOutput {
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
}

export interface SendEmailResult {
  success: boolean;
  providerMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  isRetryable?: boolean;
}

export interface NotificationOutcome {
  status: NotificationDeliveryStatus;
  channel: NotificationChannel;
  event: NotificationEvent;
  recipient: string;
  providerMessageId?: string | null;
  error?: string | null;
  errorCode?: string | null;
  attemptCount: number;
}
