import { describe, expect, it, vi } from "vitest";

import { createGuestBooking } from "@/lib/booking/booking-service";
import { localToUtc, utcToLocal } from "@/lib/availability/date-utils";
import * as lookupService from "@/lib/lookup/lookup-service";

describe("Deep QA: Booking Edge Cases & Lookup Security Invariants", () => {
  describe("Idempotency Replay & Conflict Safety", () => {
    it("returns IDEMPOTENCY_CONFLICT when an idempotency key is reused with mismatched parameters", async () => {
      // Mock Supabase service role client to return an existing idempotency key with a DIFFERENT request_hash
      vi.spyOn(
        await import("@/lib/supabase/service-role"),
        "createServiceRoleClient",
      ).mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "booking_idempotency_keys") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              gt: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  response_payload: { public_reference: "AZR-EXISTING-001" },
                  request_hash:
                    "different_hash_000000000000000000000000000000000000000000000000000000",
                },
                error: null,
              }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }),
      } as never);

      const result = await createGuestBooking({
        customerName: "Zaid Ahmed",
        phoneNumber: "+91 98765 43210",
        serviceIds: ["00000000-0000-4000-8000-000000000101"],
        dateStr: "2026-11-25",
        startTime: "10:00",
        idempotencyKey: "test_key_mismatch_12345",
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("IDEMPOTENCY_CONFLICT");
      expect(result.error).toContain("Idempotency key reused with mismatched request parameters");
    });
  });

  describe("Lookup Protocol Expiry, Attempt Locks & Replay Protection", () => {
    it("rejects verification when challenge code has expired", async () => {
      vi.spyOn(
        await import("@/lib/supabase/service-role"),
        "createServiceRoleClient",
      ).mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "appointments") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "appt-id-123",
                  public_reference: "AZR-EXP-TEST",
                  customer_name: "Test Client",
                  status: "pending",
                  appointment_start: "2026-11-20T05:30:00Z",
                  appointment_end: "2026-11-20T06:00:00Z",
                  timezone: "Asia/Kolkata",
                  created_at: "2026-10-21T00:00:00Z",
                  appointment_services: [],
                },
                error: null,
              }),
            };
          }
          if (table === "appointment_verifications") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              update: vi
                .fn()
                .mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "verif-id-123",
                  token_hash: "dummy_hash",
                  attempts: 1,
                  max_attempts: 5,
                  is_consumed: false,
                  expires_at: new Date(Date.now() - 60000).toISOString(), // Expired 1 min ago
                },
                error: null,
              }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }),
      } as never);

      const result = await lookupService.verifyAppointmentLookup({
        publicReference: "AZR-EXP-TEST",
        token: "123456",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("expired");
    });

    it("rejects verification when maximum attempts limit has been exceeded", async () => {
      vi.spyOn(
        await import("@/lib/supabase/service-role"),
        "createServiceRoleClient",
      ).mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "appointments") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "appt-id-123",
                  public_reference: "AZR-LOCK-TEST",
                },
                error: null,
              }),
            };
          }
          if (table === "appointment_verifications") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              update: vi
                .fn()
                .mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "verif-id-456",
                  token_hash: "dummy_hash",
                  attempts: 5, // Already reached max
                  max_attempts: 5,
                  is_consumed: false,
                  expires_at: new Date(Date.now() + 600000).toISOString(),
                },
                error: null,
              }),
            };
          }
          return {};
        }),
      } as never);

      const result = await lookupService.verifyAppointmentLookup({
        publicReference: "AZR-LOCK-TEST",
        token: "123456",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Maximum verification attempts exceeded");
    });

    it("rejects verification when no active unconsumed challenge exists (replay protection)", async () => {
      vi.spyOn(
        await import("@/lib/supabase/service-role"),
        "createServiceRoleClient",
      ).mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "appointments") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "appt-id-123", public_reference: "AZR-REPLAY-TEST" },
                error: null,
              }),
            };
          }
          if (table === "appointment_verifications") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }), // All consumed
            };
          }
          return {};
        }),
      } as never);

      const result = await lookupService.verifyAppointmentLookup({
        publicReference: "AZR-REPLAY-TEST",
        token: "123456",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("No active verification challenge found");
    });

    it("rejects verification when token does not match the active challenge for the referenced appointment", async () => {
      vi.spyOn(
        await import("@/lib/supabase/service-role"),
        "createServiceRoleClient",
      ).mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "appointments") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "appt-id-target", public_reference: "AZR-TARGET-APPT" },
                error: null,
              }),
            };
          }
          if (table === "appointment_verifications") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "ver-id-target",
                  token_hash: "expected_hash_different_from_submitted_token",
                  attempts: 1,
                  max_attempts: 5,
                  is_consumed: false,
                  expires_at: new Date(Date.now() + 600000).toISOString(),
                },
                error: null,
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
          return {};
        }),
      } as never);

      const result = await lookupService.verifyAppointmentLookup({
        publicReference: "AZR-TARGET-APPT",
        token: "999999", // Token from another appointment or guess
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Incorrect verification code");
      expect(result.error).toContain("3 attempt(s) remaining");
    });
  });

  describe("Timezone & Calendar Date Invariants", () => {
    it("correctly converts local date/time in Asia/Kolkata (UTC+5:30) to exact UTC instant", () => {
      // 10:00 AM in Asia/Kolkata on 2026-11-20 is 04:30 AM UTC
      const utcDate = localToUtc("2026-11-20", "10:00", "Asia/Kolkata");
      expect(utcDate.toISOString()).toBe("2026-11-20T04:30:00.000Z");
    });

    it("correctly converts late night local time across day boundary into UTC", () => {
      // 02:30 AM in Asia/Kolkata on 2026-11-20 is 21:00 PM UTC on the PREVIOUS day (2026-11-19)
      const utcDate = localToUtc("2026-11-20", "02:30", "Asia/Kolkata");
      expect(utcDate.toISOString()).toBe("2026-11-19T21:00:00.000Z");

      // Round-trip back to local time string
      const localTime = utcToLocal(utcDate, "Asia/Kolkata").timeStr;
      expect(localTime).toBe("02:30");
    });
  });
});
