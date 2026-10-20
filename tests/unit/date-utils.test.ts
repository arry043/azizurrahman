import { describe, expect, it } from "vitest";

import {
  addDays,
  addMinutes,
  daysBetween,
  formatTimeForDisplay,
  getDaysInMonth,
  intervalsOverlap,
  isAfterDate,
  isBeforeDate,
  localToUtc,
  minutesToTime,
  timeToMinutes,
  utcToLocal,
} from "@/lib/availability/date-utils";

describe("Availability Date & Timezone Utilities", () => {
  const tzIST = "Asia/Kolkata"; // UTC+05:30

  describe("timeToMinutes and minutesToTime", () => {
    it("converts HH:mm to minutes accurately", () => {
      expect(timeToMinutes("00:00")).toBe(0);
      expect(timeToMinutes("10:00")).toBe(600);
      expect(timeToMinutes("10:30")).toBe(630);
      expect(timeToMinutes("17:45")).toBe(1065);
      expect(timeToMinutes("23:59")).toBe(1439);
    });

    it("converts minutes to HH:mm string", () => {
      expect(minutesToTime(0)).toBe("00:00");
      expect(minutesToTime(600)).toBe("10:00");
      expect(minutesToTime(630)).toBe("10:30");
      expect(minutesToTime(1065)).toBe("17:45");
      expect(minutesToTime(1439)).toBe("23:59");
    });

    it("adds minutes correctly", () => {
      expect(addMinutes("10:00", 30)).toBe("10:30");
      expect(addMinutes("10:30", 45)).toBe("11:15");
      expect(addMinutes("12:00", 60)).toBe("13:00");
    });

    it("formats time for display (12-hour AM/PM)", () => {
      expect(formatTimeForDisplay("09:00")).toBe("9:00 AM");
      expect(formatTimeForDisplay("10:30")).toBe("10:30 AM");
      expect(formatTimeForDisplay("12:00")).toBe("12:00 PM");
      expect(formatTimeForDisplay("15:45")).toBe("3:45 PM");
    });
  });

  describe("Timezone conversions: localToUtc & utcToLocal", () => {
    it("maps IST local time to UTC instant accurately", () => {
      // 10:00 AM IST on 2026-10-21 is 04:30 AM UTC on 2026-10-21
      const utc = localToUtc("2026-10-21", "10:00", tzIST);
      expect(utc.toISOString()).toBe("2026-10-21T04:30:00.000Z");

      const local = utcToLocal(utc, tzIST);
      expect(local.dateStr).toBe("2026-10-21");
      expect(local.timeStr).toBe("10:00");
      expect(local.weekday).toBe(3); // Wednesday
    });

    it("handles consultation-local midnight differing from UTC midnight", () => {
      // 00:00 AM IST on 2026-10-21 is 18:30 UTC on 2026-10-20 (previous calendar date in UTC!)
      const utc = localToUtc("2026-10-21", "00:00", tzIST);
      expect(utc.toISOString()).toBe("2026-10-20T18:30:00.000Z");

      const local = utcToLocal(utc, tzIST);
      expect(local.dateStr).toBe("2026-10-21");
      expect(local.timeStr).toBe("00:00");
    });

    it("handles daylight saving time transitions where applicable", () => {
      // London spring forward transition on 2026-03-29
      const tzLondon = "Europe/London";
      const utcBeforeDst = localToUtc("2026-03-29", "00:30", tzLondon);
      expect(utcBeforeDst.toISOString()).toBe("2026-03-29T00:30:00.000Z");

      const utcAfterDst = localToUtc("2026-03-29", "03:30", tzLondon);
      expect(utcAfterDst.toISOString()).toBe("2026-03-29T02:30:00.000Z");
    });
  });

  describe("Date comparison and calendar helpers", () => {
    it("compares calendar date strings reliably", () => {
      expect(isBeforeDate("2026-10-20", "2026-10-21")).toBe(true);
      expect(isBeforeDate("2026-10-21", "2026-10-20")).toBe(false);
      expect(isAfterDate("2026-10-25", "2026-10-21")).toBe(true);
    });

    it("adds days and computes days between", () => {
      expect(addDays("2026-10-21", 5)).toBe("2026-10-26");
      expect(addDays("2026-10-28", 5)).toBe("2026-11-02"); // Month rollover
      expect(daysBetween("2026-10-21", "2026-10-26")).toBe(5);
    });

    it("returns correct days in month", () => {
      expect(getDaysInMonth(2026, 2)).toBe(28); // 2026 is not a leap year
      expect(getDaysInMonth(2026, 10)).toBe(31);
      expect(getDaysInMonth(2026, 11)).toBe(30);
    });

    it("detects half-open interval overlaps accurately", () => {
      const aStart = new Date("2026-10-21T10:00:00Z");
      const aEnd = new Date("2026-10-21T11:00:00Z");

      // Overlapping intervals
      expect(
        intervalsOverlap(
          aStart,
          aEnd,
          new Date("2026-10-21T10:30:00Z"),
          new Date("2026-10-21T11:30:00Z"),
        ),
      ).toBe(true);

      // Back-to-back intervals do not overlap in half-open [start, end)
      expect(
        intervalsOverlap(
          aStart,
          aEnd,
          new Date("2026-10-21T11:00:00Z"),
          new Date("2026-10-21T12:00:00Z"),
        ),
      ).toBe(false);

      expect(
        intervalsOverlap(
          aStart,
          aEnd,
          new Date("2026-10-21T09:00:00Z"),
          new Date("2026-10-21T10:00:00Z"),
        ),
      ).toBe(false);
    });
  });
});
