import { describe, expect, it } from "vitest";

import {
  calculateCandidateSlotsForDate,
  calculateServiceAggregation,
  resolveWorkingHoursForDate,
  WorkingInterval,
} from "@/lib/availability/availability-service";

describe("Availability Engine — Domain Rules & Logic", () => {
  const tz = "Asia/Kolkata";

  describe("Service duration and buffer aggregation (BR-04, BR-05)", () => {
    it("aggregates single service duration and buffers", () => {
      const agg = calculateServiceAggregation([
        { duration_minutes: 45, buffer_before_minutes: 10, buffer_after_minutes: 15 },
      ]);
      expect(agg.durationMinutes).toBe(45);
      expect(agg.bufferBeforeMinutes).toBe(10);
      expect(agg.bufferAfterMinutes).toBe(15);
    });

    it("aggregates multiple services: duration sums, buffers take the max", () => {
      const agg = calculateServiceAggregation([
        { duration_minutes: 30, buffer_before_minutes: 10, buffer_after_minutes: 5 },
        { duration_minutes: 45, buffer_before_minutes: 15, buffer_after_minutes: 20 },
      ]);
      expect(agg.durationMinutes).toBe(75); // 30 + 45
      expect(agg.bufferBeforeMinutes).toBe(15); // max(10, 15)
      expect(agg.bufferAfterMinutes).toBe(20); // max(5, 20)
    });

    it("throws when service list is empty", () => {
      expect(() => calculateServiceAggregation([])).toThrow(RangeError);
    });
  });

  describe("Working hours resolution & override precedence (BR-06, BR-07, BR-08, BR-09)", () => {
    const weeklyAvailability = new Map<number, boolean>([
      [0, true], // Sunday closed
      [1, false], // Monday open
      [2, false], // Tuesday open
    ]);

    const weeklyIntervals = new Map<number, WorkingInterval[]>([
      [
        1,
        [
          { startTime: "10:00", endTime: "13:00" },
          { startTime: "15:00", endTime: "19:00" },
        ],
      ],
      [2, [{ startTime: "10:00", endTime: "17:00" }]],
    ]);

    it("uses weekly intervals when no date override exists", () => {
      const result = resolveWorkingHoursForDate({
        dateStr: "2026-10-26", // Monday
        weekday: 1,
        weeklyAvailability,
        weeklyIntervals,
        dateOverrides: new Map(),
        dateOverrideIntervals: new Map(),
      });

      expect(result.isClosed).toBe(false);
      expect(result.intervals).toHaveLength(2);
      expect(result.intervals[0]?.startTime).toBe("10:00");
      expect(result.intervals[0]?.endTime).toBe("13:00");
    });

    it("returns closed for normally closed weekday (Sunday)", () => {
      const result = resolveWorkingHoursForDate({
        dateStr: "2026-10-25", // Sunday
        weekday: 0,
        weeklyAvailability,
        weeklyIntervals,
        dateOverrides: new Map(),
        dateOverrideIntervals: new Map(),
      });

      expect(result.isClosed).toBe(true);
      expect(result.intervals).toHaveLength(0);
    });

    it("explicit full-day date closure wins over open weekly schedule", () => {
      const dateOverrides = new Map([["2026-10-26", { isClosed: true, overrideId: "ov-1" }]]);

      const result = resolveWorkingHoursForDate({
        dateStr: "2026-10-26", // Monday
        weekday: 1,
        weeklyAvailability,
        weeklyIntervals,
        dateOverrides,
        dateOverrideIntervals: new Map(),
      });

      expect(result.isClosed).toBe(true);
      expect(result.intervals).toHaveLength(0);
    });

    it("custom date override hours replace weekly schedule", () => {
      const dateOverrides = new Map([["2026-10-26", { isClosed: false, overrideId: "ov-2" }]]);
      const dateOverrideIntervals = new Map([["ov-2", [{ startTime: "11:00", endTime: "14:00" }]]]);

      const result = resolveWorkingHoursForDate({
        dateStr: "2026-10-26",
        weekday: 1,
        weeklyAvailability,
        weeklyIntervals,
        dateOverrides,
        dateOverrideIntervals,
      });

      expect(result.isClosed).toBe(false);
      expect(result.intervals).toEqual([{ startTime: "11:00", endTime: "14:00" }]);
    });

    it("date override can reopen a normally closed Sunday when custom intervals exist (BR-09)", () => {
      const dateOverrides = new Map([["2026-10-25", { isClosed: false, overrideId: "ov-sun" }]]);
      const dateOverrideIntervals = new Map([
        ["ov-sun", [{ startTime: "10:00", endTime: "14:00" }]],
      ]);

      const result = resolveWorkingHoursForDate({
        dateStr: "2026-10-25", // Sunday
        weekday: 0,
        weeklyAvailability,
        weeklyIntervals,
        dateOverrides,
        dateOverrideIntervals,
      });

      expect(result.isClosed).toBe(false);
      expect(result.intervals).toEqual([{ startTime: "10:00", endTime: "14:00" }]);
    });
  });

  describe("Candidate slot generation and constraint fitting (BR-02, BR-07, BR-10, BR-12)", () => {
    const workingIntervals: WorkingInterval[] = [
      { startTime: "10:00", endTime: "13:00" },
      { startTime: "15:00", endTime: "18:00" },
    ];

    it("generates slots aligned to interval boundaries without crossing lunch breaks", () => {
      // 30-min duration, 0 buffers, 30-min slot interval
      // 10:00 to 13:00 has 6 slots: 10:00, 10:30, 11:00, 11:30, 12:00, 12:30.
      // 15:00 to 18:00 has 6 slots: 15:00, 15:30, 16:00, 16:30, 17:00, 17:30.
      // Break is 13:00-15:00.
      const slots = calculateCandidateSlotsForDate({
        dateStr: "2026-10-26",
        timeZone: tz,
        workingIntervals,
        durationMinutes: 30,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        slotIntervalMinutes: 30,
        minAdvanceNoticeMinutes: 0,
        existingAppointments: [],
        referenceTime: new Date("2026-10-20T00:00:00Z"),
      });

      expect(slots).toHaveLength(12);
      expect(slots[0]?.startTime).toBe("10:00");
      expect(slots[5]?.startTime).toBe("12:30");
      expect(slots[5]?.endTime).toBe("13:00");
      expect(slots[6]?.startTime).toBe("15:00");
      // No slot exists in the 13:00 - 15:00 break
      expect(slots.some((s) => s.startTime === "13:00" || s.startTime === "13:30")).toBe(false);
    });

    it("requires full duration and buffers to fit inside working interval", () => {
      // 60-min duration with 15-min after buffer = 75-min required block.
      // At 12:00: 12:00 + 75min = 13:15 > 13:00 (closing of morning shift). Must be excluded!
      const slots = calculateCandidateSlotsForDate({
        dateStr: "2026-10-26",
        timeZone: tz,
        workingIntervals: [{ startTime: "10:00", endTime: "13:00" }],
        durationMinutes: 60,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 15,
        slotIntervalMinutes: 30,
        minAdvanceNoticeMinutes: 0,
        existingAppointments: [],
        referenceTime: new Date("2026-10-20T00:00:00Z"),
      });

      // 10:00 -> 11:15 (fits)
      // 10:30 -> 11:45 (fits)
      // 11:00 -> 12:15 (fits)
      // 11:30 -> 12:45 (fits)
      // 12:00 -> 13:15 (exceeds 13:00 -> excluded)
      expect(slots.map((s) => s.startTime)).toEqual(["10:00", "10:30", "11:00", "11:30"]);
    });

    it("excludes slots violating minimum advance notice (BR-10)", () => {
      // Reference time is 2026-10-26 at 09:00 AM IST (03:30 UTC)
      // Advance notice is 120 minutes (2 hours). Earliest allowed is 11:00 AM IST.
      const referenceTime = new Date("2026-10-26T03:30:00.000Z"); // 09:00 AM IST
      const slots = calculateCandidateSlotsForDate({
        dateStr: "2026-10-26",
        timeZone: tz,
        workingIntervals: [{ startTime: "10:00", endTime: "13:00" }],
        durationMinutes: 30,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        slotIntervalMinutes: 30,
        minAdvanceNoticeMinutes: 120, // 2 hours
        existingAppointments: [],
        referenceTime,
      });

      // 10:00 and 10:30 are before 11:00 AM -> excluded!
      expect(slots.map((s) => s.startTime)).toEqual(["11:00", "11:30", "12:00", "12:30"]);
    });

    it("excludes slots that overlap with capacity-reserving appointments (BR-02, BR-14)", () => {
      // Existing appointment from 10:30 to 11:15 IST (05:00 to 05:45 UTC)
      const existingAppointments = [
        {
          id: "appt-1",
          blockedStart: new Date("2026-10-26T05:00:00.000Z"), // 10:30 IST
          blockedEnd: new Date("2026-10-26T05:45:00.000Z"), // 11:15 IST
          status: "confirmed",
        },
      ];

      const slots = calculateCandidateSlotsForDate({
        dateStr: "2026-10-26",
        timeZone: tz,
        workingIntervals: [{ startTime: "10:00", endTime: "13:00" }],
        durationMinutes: 30,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        slotIntervalMinutes: 30,
        minAdvanceNoticeMinutes: 0,
        existingAppointments,
        referenceTime: new Date("2026-10-20T00:00:00Z"),
      });

      // 10:00 to 10:30 (fits, adjacent)
      // 10:30 to 11:00 (overlaps appt-1 -> excluded)
      // 11:00 to 11:30 (overlaps appt-1 until 11:15 -> excluded)
      // 11:30 to 12:00 (fits)
      // 12:00 to 12:30 (fits)
      // 12:30 to 13:00 (fits)
      expect(slots.map((s) => s.startTime)).toEqual(["10:00", "11:30", "12:00", "12:30"]);
    });
  });
});
