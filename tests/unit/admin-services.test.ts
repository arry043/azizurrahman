import { describe, expect, it } from "vitest";

import { validateIntervals } from "@/lib/admin/availability-admin-service";
import { generateSlug, serviceInputSchema } from "@/lib/admin/services-admin-service";
import { settingsInputSchema } from "@/lib/admin/settings-admin-service";
import { canTransition, reservesCapacity } from "@/lib/booking/status";
import { AppError } from "@/lib/errors";

describe("Admin Domain Services & Business Rules", () => {
  describe("Slug Generation & Validation", () => {
    it("generates URL-safe slugs from service titles", () => {
      expect(generateSlug("Spiritual Guidance Consultation")).toBe(
        "spiritual-guidance-consultation",
      );
      expect(generateSlug("Rohani Ilaj & Dua (Special)")).toBe("rohani-ilaj-dua-special");
      expect(generateSlug("   Multiple   Spaces   ")).toBe("multiple-spaces");
      expect(generateSlug("Clean-Slug-Already")).toBe("clean-slug-already");
    });

    it("validates service schema against database constraints", () => {
      const valid = serviceInputSchema.safeParse({
        name: "Standard Consultation",
        slug: "standard-consultation",
        duration_minutes: 60,
        buffer_before_minutes: 10,
        buffer_after_minutes: 15,
        display_order: 10,
        is_active: true,
      });
      expect(valid.success).toBe(true);
    });

    it("rejects invalid service durations", () => {
      const zeroDuration = serviceInputSchema.safeParse({
        name: "Zero Duration",
        slug: "zero-duration",
        duration_minutes: 0,
      });
      expect(zeroDuration.success).toBe(false);

      const excessiveDuration = serviceInputSchema.safeParse({
        name: "Too Long",
        slug: "too-long",
        duration_minutes: 800,
      });
      expect(excessiveDuration.success).toBe(false);
    });

    it("rejects negative buffers", () => {
      const negativeBuffer = serviceInputSchema.safeParse({
        name: "Negative Buffer",
        slug: "negative-buffer",
        duration_minutes: 30,
        buffer_before_minutes: -5,
      });
      expect(negativeBuffer.success).toBe(false);
    });
  });

  describe("Interval Validation & Overlap Prevention", () => {
    it("accepts valid, non-overlapping intervals", () => {
      expect(() =>
        validateIntervals([
          { start_time: "10:00", end_time: "13:00" },
          { start_time: "15:00", end_time: "19:00" },
        ]),
      ).not.toThrow();
    });

    it("rejects intervals where end_time <= start_time", () => {
      expect(() => validateIntervals([{ start_time: "14:00", end_time: "12:00" }])).toThrow(
        AppError,
      );

      expect(() => validateIntervals([{ start_time: "10:00", end_time: "10:00" }])).toThrow(
        AppError,
      );
    });

    it("rejects overlapping intervals within the same day", () => {
      expect(() =>
        validateIntervals([
          { start_time: "10:00", end_time: "14:00" },
          { start_time: "13:00", end_time: "17:00" },
        ]),
      ).toThrow(/Overlapping intervals detected/);
    });
  });

  describe("Appointment Status Transitions & Capacity Rules", () => {
    it("allows valid forward transitions", () => {
      expect(canTransition("pending", "confirmed")).toBe(true);
      expect(canTransition("pending", "reschedule_requested")).toBe(true);
      expect(canTransition("pending", "declined")).toBe(true);
      expect(canTransition("pending", "cancelled")).toBe(true);
      expect(canTransition("confirmed", "reschedule_requested")).toBe(true);
      expect(canTransition("confirmed", "cancelled")).toBe(true);
      expect(canTransition("reschedule_requested", "confirmed")).toBe(true);
      expect(canTransition("reschedule_requested", "declined")).toBe(true);
    });

    it("prohibits invalid or backwards transitions", () => {
      expect(canTransition("confirmed", "pending")).toBe(false);
      expect(canTransition("declined", "confirmed")).toBe(false);
      expect(canTransition("cancelled", "confirmed")).toBe(false);
      expect(canTransition("declined", "pending")).toBe(false);
      expect(canTransition("cancelled", "pending")).toBe(false);
    });

    it("correctly identifies capacity-reserving statuses", () => {
      expect(reservesCapacity("pending")).toBe(true);
      expect(reservesCapacity("confirmed")).toBe(true);
      expect(reservesCapacity("reschedule_requested")).toBe(true);
      expect(reservesCapacity("declined")).toBe(false);
      expect(reservesCapacity("cancelled")).toBe(false);
    });
  });

  describe("Site Settings Validation", () => {
    it("accepts valid operational settings", () => {
      const valid = settingsInputSchema.safeParse({
        booking_horizon_days: 60,
        min_advance_notice_minutes: 1440,
        slot_interval_minutes: 30,
        public_phone: "+919876543210",
        public_whatsapp: "+919876543210",
        public_email: "info@azizurrahman.com",
        public_address: "Bandra West, Mumbai, MH, India",
        consultation_hours_text: "Mon–Sat 10:00 AM – 7:00 PM IST",
      });
      expect(valid.success).toBe(true);
    });

    it("rejects non-E.164 phone numbers", () => {
      const invalid = settingsInputSchema.safeParse({
        booking_horizon_days: 30,
        min_advance_notice_minutes: 60,
        slot_interval_minutes: 30,
        public_phone: "09876543210", // Missing + prefix
      });
      expect(invalid.success).toBe(false);
    });

    it("rejects out-of-bounds scheduling parameters", () => {
      const horizonZero = settingsInputSchema.safeParse({
        booking_horizon_days: 0,
        min_advance_notice_minutes: 60,
        slot_interval_minutes: 30,
      });
      expect(horizonZero.success).toBe(false);

      const intervalTooSmall = settingsInputSchema.safeParse({
        booking_horizon_days: 30,
        min_advance_notice_minutes: 60,
        slot_interval_minutes: 2, // Min is 5
      });
      expect(intervalTooSmall.success).toBe(false);
    });
  });
});
