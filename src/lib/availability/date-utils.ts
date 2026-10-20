/**
 * Date and timezone utilities for the AZIZURRAHMAN calendar and availability engine.
 *
 * All operations respect the consultation timezone (e.g. Asia/Kolkata).
 * We never slice UTC ISO strings to determine local dates or times.
 */

export interface LocalDateParts {
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hours: number;
  minutes: number;
  weekday: number; // 0 = Sunday ... 6 = Saturday (matches Postgres extract(dow))
}

/**
 * Parses "HH:mm" or "HH:mm:ss" into minutes from start of day (0..1440).
 */
export function timeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] ?? 0);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new RangeError(`Invalid time string: "${timeStr}"`);
  }
  return hours * 60 + minutes;
}

/**
 * Converts minutes from start of day (0..1440) to "HH:mm".
 */
export function minutesToTime(totalMinutes: number): string {
  const normalized = Math.max(0, Math.min(1440, Math.round(totalMinutes)));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Adds minutes to a "HH:mm" time string.
 */
export function addMinutes(timeStr: string, minutesToAdd: number): string {
  return minutesToTime(timeToMinutes(timeStr) + minutesToAdd);
}

/**
 * Formats a 24-hr time string "HH:mm" into user-friendly "h:mm A" (e.g. "10:00 AM").
 */
export function formatTimeForDisplay(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? 0);
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Decomposes a UTC Date into local components within the given timezone.
 */
export function utcToLocal(utcDate: Date, timeZone: string): LocalDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
  });

  const parts = formatter.formatToParts(utcDate);
  const p: Record<string, string> = {};
  for (const part of parts) {
    p[part.type] = part.value;
  }

  const year = Number(p.year);
  const month = Number(p.month);
  const day = Number(p.day);
  const rawHour = Number(p.hour);
  const hours = rawHour === 24 ? 0 : rawHour;
  const minutes = Number(p.minute);

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const weekday = weekdayMap[p.weekday ?? ""] ?? 0;

  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  return {
    dateStr,
    timeStr,
    year,
    month,
    day,
    hours,
    minutes,
    weekday,
  };
}

/**
 * Converts a local calendar date ("YYYY-MM-DD") and local time ("HH:mm") in timeZone
 * into an unambiguous UTC Date instant.
 */
export function localToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, min] = timeStr.split(":").map(Number);

  if (!year || !month || !day || hour === undefined || min === undefined) {
    throw new RangeError(`Invalid date/time format: "${dateStr}" "${timeStr}"`);
  }

  let utcGuess = new Date(Date.UTC(year, month - 1, day, hour, min));

  // Iteratively converge to handle timezone offsets and daylight saving boundaries
  for (let iter = 0; iter < 3; iter++) {
    const local = utcToLocal(utcGuess, timeZone);
    const targetMs = Date.UTC(year, month - 1, day, hour, min);
    const actualMs = Date.UTC(local.year, local.month - 1, local.day, local.hours, local.minutes);
    const diff = targetMs - actualMs;
    if (diff === 0) break;
    utcGuess = new Date(utcGuess.getTime() + diff);
  }

  return utcGuess;
}

/**
 * Returns the current local calendar date string ("YYYY-MM-DD") in the consultation timezone.
 */
export function getTodayDateStr(timeZone: string, referenceTime: Date = new Date()): string {
  return utcToLocal(referenceTime, timeZone).dateStr;
}

/**
 * Returns whether dateA is strictly before dateB (both in "YYYY-MM-DD" format).
 */
export function isBeforeDate(dateA: string, dateB: string): boolean {
  return dateA < dateB;
}

/**
 * Returns whether dateA is strictly after dateB (both in "YYYY-MM-DD" format).
 */
export function isAfterDate(dateA: string, dateB: string): boolean {
  return dateA > dateB;
}

/**
 * Adds integer days to a "YYYY-MM-DD" string.
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d! + days));
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Computes calendar days between two "YYYY-MM-DD" strings (end - start).
 */
export function daysBetween(startDateStr: string, endDateStr: string): number {
  const [y1, m1, d1] = startDateStr.split("-").map(Number);
  const [y2, m2, d2] = endDateStr.split("-").map(Number);
  const ms1 = Date.UTC(y1!, m1! - 1, d1!);
  const ms2 = Date.UTC(y2!, m2! - 1, d2!);
  return Math.round((ms2 - ms1) / (24 * 60 * 60 * 1000));
}

/**
 * Returns the number of days in a given month (year, month: 1..12).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Determines whether two half-open intervals [startA, endA) and [startB, endB) overlap in time.
 */
export function intervalsOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
}
