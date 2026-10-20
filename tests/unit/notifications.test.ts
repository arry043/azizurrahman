import { describe, expect, it, vi } from "vitest";

import { buildWhatsAppUrl } from "@/components/contact/contact-actions";
import { MockEmailAdapter } from "@/lib/notifications/adapters/mock-adapter";
import { ResendEmailAdapter } from "@/lib/notifications/adapters/resend-adapter";
import { sendAppointmentNotification } from "@/lib/notifications/delivery-service";
import { renderAppointmentEmail } from "@/lib/notifications/templates";
import type { AppointmentNotificationPayload, NotificationEvent } from "@/lib/notifications/types";

// Mock Supabase service role client to prevent external DB calls during unit test
vi.mock("@/lib/supabase/service-role", () => {
  const store = new Map<string, unknown>();

  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockImplementation((col: string, val: string) => {
      if (col === "idempotency_key" && store.has(val)) {
        return {
          maybeSingle: vi.fn().mockResolvedValue({ data: store.get(val), error: null }),
        };
      }
      return {
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
    insert: vi.fn().mockImplementation((record: { idempotency_key?: string; status: string }) => {
      if (record.idempotency_key) {
        store.set(record.idempotency_key, record);
      }
      return { error: null };
    }),
  };

  const mockSupabase = {
    from: vi.fn(() => mockQuery),
  };

  return {
    createServiceRoleClient: vi.fn(() => mockSupabase),
    createSupabaseServiceRoleClient: vi.fn(() => mockSupabase),
  };
});

const sampleAppointment: AppointmentNotificationPayload = {
  appointmentId: "11111111-2222-3333-4444-555555555555",
  publicReference: "REF-TEST-9988",
  customerName: "Ahmad Raza",
  email: "ahmad.raza@example.com",
  phone: "+919876543210",
  status: "pending",
  appointmentStart: "2026-11-05T04:30:00.000Z", // 10:00 AM IST
  appointmentEnd: "2026-11-05T05:15:00.000Z", // 10:45 AM IST
  timeZone: "Asia/Kolkata",
  services: [{ name: "Spiritual Guidance & Dua", durationMinutes: 45 }],
};

describe("Phase 12: Notification System & Contact Integrations", () => {
  describe("Email Template Generation", () => {
    const events: NotificationEvent[] = [
      "booking_request_received",
      "appointment_confirmed",
      "appointment_declined",
      "appointment_cancelled",
      "appointment_rescheduled",
    ];

    it.each(events)("renders complete branded output for event: %s", (event) => {
      const rendered = renderAppointmentEmail(event, sampleAppointment, "https://azizurrahman.com");

      // Required header & branding
      expect(rendered.subject).toContain("AZIZURRAHMAN");
      expect(rendered.subject).toContain("REF-TEST-9988");
      expect(rendered.html).toContain("Maulvi Azizurrahman (Aamil)");
      expect(rendered.html).toContain("Ahmad Raza");

      // Appointment Reference
      expect(rendered.html).toContain("REF-TEST-9988");
      expect(rendered.text).toContain("REF-TEST-9988");

      // Services snapshot
      expect(rendered.html).toContain("Spiritual Guidance &amp; Dua");
      expect(rendered.html).toContain("45 mins");
      expect(rendered.text).toContain("Spiritual Guidance & Dua");

      // Online receipt link
      expect(rendered.html).toContain("https://azizurrahman.com/appointments/REF-TEST-9988");
      expect(rendered.text).toContain("https://azizurrahman.com/appointments/REF-TEST-9988");

      // Official Contact Details
      expect(rendered.html).toContain(
        "Village Kharewan, Saraimeer, Azamgarh, Uttar Pradesh, India — 276305",
      );
      expect(rendered.html).toContain("azizurrahman8423@gmail.com");

      // Faith perspective
      expect(rendered.html).toContain("healing is solely by Allah&#039;s grace");

      // Never leaks internal secrets
      expect(rendered.html).not.toContain("SUPABASE");
      expect(rendered.html).not.toContain("service_role");
      expect(rendered.html).not.toContain("private_admin_notes");
    });

    it("clearly distinguishes a pending request from a confirmed booking", () => {
      const received = renderAppointmentEmail(
        "booking_request_received",
        sampleAppointment,
        "http://localhost:3000",
      );
      expect(received.html).toContain("Pending Review");
      expect(received.html).toContain("does not represent a finalized confirmation");

      const confirmed = renderAppointmentEmail(
        "appointment_confirmed",
        sampleAppointment,
        "http://localhost:3000",
      );
      expect(confirmed.html).toContain("Confirmed");
      expect(confirmed.html).toContain("officially confirmed");
    });
  });

  describe("Delivery Service Invariants & Reliability", () => {
    it("safely skips and logs when customer has no email address", async () => {
      const mockAdapter = new MockEmailAdapter("success");
      const outcome = await sendAppointmentNotification({
        event: "booking_request_received",
        appointment: { ...sampleAppointment, email: null },
        provider: mockAdapter,
      });

      expect(outcome.status).toBe("skipped");
      expect(outcome.errorCode).toBe("NO_EMAIL_ADDRESS");
      expect(mockAdapter.sentEmails).toHaveLength(0);
    });

    it("safely skips and logs when customer provides an invalid email without '@'", async () => {
      const mockAdapter = new MockEmailAdapter("success");
      const outcome = await sendAppointmentNotification({
        event: "booking_request_received",
        appointment: { ...sampleAppointment, email: "invalid-address" },
        provider: mockAdapter,
      });

      expect(outcome.status).toBe("skipped");
      expect(outcome.errorCode).toBe("NO_EMAIL_ADDRESS");
      expect(mockAdapter.sentEmails).toHaveLength(0);
    });

    it("safely skips when email provider is not configured with credentials", async () => {
      const mockAdapter = new MockEmailAdapter("not_configured");
      const outcome = await sendAppointmentNotification({
        event: "booking_request_received",
        appointment: sampleAppointment,
        provider: mockAdapter,
      });

      expect(outcome.status).toBe("skipped");
      expect(outcome.errorCode).toBe("PROVIDER_NOT_CONFIGURED");
      expect(mockAdapter.sentEmails).toHaveLength(0);
    });

    it("prevents sending stale confirmation if appointment status already changed", async () => {
      const mockAdapter = new MockEmailAdapter("success");
      const outcome = await sendAppointmentNotification({
        event: "appointment_confirmed",
        appointment: { ...sampleAppointment, status: "cancelled" }, // Status changed to cancelled
        expectedStatus: "confirmed", // But event was for confirmed
        provider: mockAdapter,
      });

      expect(outcome.status).toBe("skipped");
      expect(outcome.errorCode).toBe("STALE_STATUS");
      expect(mockAdapter.sentEmails).toHaveLength(0);
    });

    it("delivers email and logs provider message ID upon success", async () => {
      const mockAdapter = new MockEmailAdapter("success");
      const outcome = await sendAppointmentNotification({
        event: "appointment_confirmed",
        appointment: sampleAppointment,
        expectedStatus: "pending",
        provider: mockAdapter,
      });

      expect(outcome.status).toBe("sent");
      expect(outcome.providerMessageId).toMatch(/^mock_msg_/);
      expect(mockAdapter.sentEmails).toHaveLength(1);
      expect(mockAdapter.sentEmails[0]?.to).toBe("ahmad.raza@example.com");
    });

    it("retries transient failures (rate limits & server errors) up to maxRetries", async () => {
      const mockAdapter = new MockEmailAdapter("rate_limit");
      const outcome = await sendAppointmentNotification({
        event: "booking_request_received",
        appointment: sampleAppointment,
        provider: mockAdapter,
        maxRetries: 2,
        initialBackoffMs: 10,
      });

      expect(outcome.status).toBe("failed");
      expect(outcome.errorCode).toBe("RATE_LIMIT_EXCEEDED");
      expect(outcome.attemptCount).toBe(3); // 1 initial + 2 retries
      expect(mockAdapter.attemptCount).toBe(3);
    });

    it("does NOT retry non-retryable errors like invalid address", async () => {
      const mockAdapter = new MockEmailAdapter("invalid_address");
      const outcome = await sendAppointmentNotification({
        event: "booking_request_received",
        appointment: sampleAppointment,
        provider: mockAdapter,
        maxRetries: 2,
        initialBackoffMs: 10,
      });

      expect(outcome.status).toBe("failed");
      expect(outcome.errorCode).toBe("INVALID_EMAIL_ADDRESS");
      expect(outcome.attemptCount).toBe(1); // No retries for non-retryable errors
      expect(mockAdapter.attemptCount).toBe(1);
    });

    it("detects and skips duplicate delivery for identical idempotency key", async () => {
      const mockAdapter = new MockEmailAdapter("success");
      const first = await sendAppointmentNotification({
        event: "appointment_confirmed",
        appointment: { ...sampleAppointment, appointmentId: "unique-dup-test-id" },
        provider: mockAdapter,
      });

      expect(first.status).toBe("sent");
      expect(mockAdapter.sentEmails).toHaveLength(1);

      // Second identical call
      const second = await sendAppointmentNotification({
        event: "appointment_confirmed",
        appointment: { ...sampleAppointment, appointmentId: "unique-dup-test-id" },
        provider: mockAdapter,
      });

      expect(second.status).toBe("skipped");
      expect(second.errorCode).toBe("ALREADY_SENT");
      expect(mockAdapter.sentEmails).toHaveLength(1); // Not sent twice
    });
  });

  describe("Direct Contact & WhatsApp URL Builder", () => {
    it("generates correctly formatted wa.me link with URL-encoded inquiry text", () => {
      const url = buildWhatsAppUrl("+91 8423668492");
      expect(url).toBe(
        "https://wa.me/918423668492?text=Assalamu%20Alaikum%2C%20I%20would%20like%20to%20enquire%20about%20an%20appointment%20with%20Maulvi%20Azizurrahman.",
      );
    });

    it("URL-encodes custom template text including non-ASCII and punctuation", () => {
      const custom = "Assalamu Alaikum! Inquiry regarding dua & consultation (Azamgarh).";
      const url = buildWhatsAppUrl("+91 8423668492", custom);
      expect(url).toBe(`https://wa.me/918423668492?text=${encodeURIComponent(custom)}`);
    });

    it("returns null for unconfirmed or invalid numbers without throwing", () => {
      expect(buildWhatsAppUrl("")).toBeNull();
      expect(buildWhatsAppUrl("abc-def")).toBeNull();
    });
  });

  describe("Resend Adapter Configuration Handling", () => {
    it("reports unconfigured when RESEND_API_KEY is unset or empty", () => {
      vi.stubEnv("RESEND_API_KEY", "");
      const adapter = new ResendEmailAdapter();
      expect(adapter.isConfigured()).toBe(false);
    });

    it("reports configured when RESEND_API_KEY is present", () => {
      vi.stubEnv("RESEND_API_KEY", "re_1234567890abcdef");
      const adapter = new ResendEmailAdapter();
      expect(adapter.isConfigured()).toBe(true);
    });
  });
});
