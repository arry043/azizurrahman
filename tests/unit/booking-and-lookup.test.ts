import { describe, expect, it, vi } from "vitest";

import { createGuestBooking } from "@/lib/booking/booking-service";
import * as lookupService from "@/lib/lookup/lookup-service";

vi.mock("@/lib/supabase/service-role", () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "test-verif-id" }, error: null }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  };

  const mockSupabase = {
    from: vi.fn(() => mockQuery),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    createServiceRoleClient: vi.fn(() => mockSupabase),
    createSupabaseServiceRoleClient: vi.fn(() => mockSupabase),
  };
});

describe("Booking & Lookup Domain Service Validation", () => {
  describe("Guest Booking Input Validation", () => {
    it("rejects empty or whitespace-only customer name", async () => {
      const result = await createGuestBooking({
        customerName: "   ",
        phoneNumber: "+91 98765 43210",
        serviceIds: ["00000000-0000-4000-8000-000000000101"],
        dateStr: "2026-10-25",
        startTime: "10:00",
      });
      expect(result.success).toBe(false);
      expect(result.code).toBe("INVALID_NAME");
    });

    it("rejects phone numbers that cannot be normalized to E.164", async () => {
      const result = await createGuestBooking({
        customerName: "Zaid Ahmed",
        phoneNumber: "invalid-phone",
        serviceIds: ["00000000-0000-4000-8000-000000000101"],
        dateStr: "2026-10-25",
        startTime: "10:00",
      });
      expect(result.success).toBe(false);
      expect(result.code).toBe("INVALID_PHONE");
    });

    it("rejects invalid email syntax", async () => {
      const result = await createGuestBooking({
        customerName: "Zaid Ahmed",
        phoneNumber: "+91 98765 43210",
        email: "not-an-email",
        serviceIds: ["00000000-0000-4000-8000-000000000101"],
        dateStr: "2026-10-25",
        startTime: "10:00",
      });
      expect(result.success).toBe(false);
      expect(result.code).toBe("INVALID_EMAIL");
    });

    it("rejects message exceeding 1000 characters", async () => {
      const longMessage = "A".repeat(1001);
      const result = await createGuestBooking({
        customerName: "Zaid Ahmed",
        phoneNumber: "+91 98765 43210",
        message: longMessage,
        serviceIds: ["00000000-0000-4000-8000-000000000101"],
        dateStr: "2026-10-25",
        startTime: "10:00",
      });
      expect(result.success).toBe(false);
      expect(result.code).toBe("MESSAGE_TOO_LONG");
    });

    it("rejects requests with no services selected", async () => {
      const result = await createGuestBooking({
        customerName: "Zaid Ahmed",
        phoneNumber: "+91 98765 43210",
        serviceIds: [],
        dateStr: "2026-10-25",
        startTime: "10:00",
      });
      expect(result.success).toBe(false);
      expect(result.code).toBe("NO_SERVICES");
    });

    it("rejects booking requests for past dates", async () => {
      const result = await createGuestBooking(
        {
          customerName: "Zaid Ahmed",
          phoneNumber: "+91 98765 43210",
          serviceIds: ["00000000-0000-4000-8000-000000000101"],
          dateStr: "2026-10-15", // Before 2026-10-20
          startTime: "10:00",
        },
        new Date("2026-10-20T00:00:00Z"),
      );
      expect(result.success).toBe(false);
      expect(result.code).toBe("PAST_DATE");
    });
  });

  describe("Secure Lookup Initiation & Verification", () => {
    it("rejects malformed appointment reference formats", async () => {
      const result = await lookupService.initiateAppointmentLookup({
        publicReference: "NOT-A-VALID-REF",
        contact: "+91 98765 43210",
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain("valid appointment reference code");
    });

    it("returns generic message when reference does not match to prevent enumeration", async () => {
      const result = await lookupService.initiateAppointmentLookup({
        publicReference: "AZR-99999-99999",
        contact: "+91 98765 43210",
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain("If a consultation request exists");
    });
  });
});
