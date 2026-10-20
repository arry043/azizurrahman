import "server-only";

import {
  addDays,
  getDaysInMonth,
  getTodayDateStr,
  intervalsOverlap,
  isAfterDate,
  isBeforeDate,
  localToUtc,
  minutesToTime,
  timeToMinutes,
  utcToLocal,
} from "@/lib/availability/date-utils";
import { getConsultationTimeZone } from "@/lib/env/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { ServiceRow } from "@/types/domain";

export type DayAvailabilityStatus =
  "available" | "fully_booked" | "closed" | "past" | "out_of_horizon";

export interface TimeSlot {
  startTime: string; // "10:00"
  endTime: string; // "10:30"
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  status: DayAvailabilityStatus;
  availableSlotCount: number;
  slots: TimeSlot[];
  totalDurationMinutes: number;
  timezone: string;
}

export interface MonthAvailabilitySummary {
  year: number;
  month: number;
  timezone: string;
  bookingHorizonEndDate: string;
  minAdvanceNoticeMinutes: number;
  days: {
    date: string; // YYYY-MM-DD
    status: DayAvailabilityStatus;
    availableSlotCount: number;
  }[];
}

export interface WorkingInterval {
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export interface ExistingAppointmentRange {
  id: string;
  blockedStart: Date;
  blockedEnd: Date;
  status: string;
  customerName?: string;
}

/**
 * Calculates aggregate duration and buffers for a selection of services.
 * Total duration is the sum of durations.
 * Buffer before and after take the maximum required buffer among the selected services.
 */
export function calculateServiceAggregation(
  services: Pick<
    ServiceRow,
    "duration_minutes" | "buffer_before_minutes" | "buffer_after_minutes"
  >[],
) {
  if (services.length === 0) {
    throw new RangeError("At least one service must be provided to calculate scheduling intervals");
  }

  const durationMinutes = services.reduce((sum, s) => sum + s.duration_minutes, 0);
  const bufferBeforeMinutes = Math.max(...services.map((s) => s.buffer_before_minutes), 0);
  const bufferAfterMinutes = Math.max(...services.map((s) => s.buffer_after_minutes), 0);

  return {
    durationMinutes,
    bufferBeforeMinutes,
    bufferAfterMinutes,
  };
}

/**
 * Resolves working hours for a date given weekly availability and date overrides.
 *
 * Precedence:
 * 1. An explicit date override for `dateStr`:
 *    - if is_closed = true -> closed.
 *    - if is_closed = false -> use override intervals (if none, closed).
 * 2. Weekly schedule for weekday:
 *    - if is_closed = true -> closed.
 *    - if is_closed = false -> use weekly intervals.
 */
export function resolveWorkingHoursForDate({
  dateStr,
  weekday,
  weeklyAvailability,
  weeklyIntervals,
  dateOverrides,
  dateOverrideIntervals,
}: {
  dateStr: string;
  weekday: number;
  weeklyAvailability: Map<number, boolean>; // weekday -> is_closed
  weeklyIntervals: Map<number, WorkingInterval[]>; // weekday -> intervals
  dateOverrides: Map<string, { isClosed: boolean; overrideId: string }>; // dateStr -> override
  dateOverrideIntervals: Map<string, WorkingInterval[]>; // overrideId -> intervals
}): { isClosed: boolean; intervals: WorkingInterval[] } {
  const override = dateOverrides.get(dateStr);
  if (override) {
    if (override.isClosed) {
      return { isClosed: true, intervals: [] };
    }
    const intervals = dateOverrideIntervals.get(override.overrideId) ?? [];
    if (intervals.length === 0) {
      return { isClosed: true, intervals: [] };
    }
    return { isClosed: false, intervals };
  }

  const isWeeklyClosed = weeklyAvailability.get(weekday) ?? true;
  if (isWeeklyClosed) {
    return { isClosed: true, intervals: [] };
  }

  const intervals = weeklyIntervals.get(weekday) ?? [];
  if (intervals.length === 0) {
    return { isClosed: true, intervals: [] };
  }

  return { isClosed: false, intervals };
}

/**
 * Pure calculation of candidate time slots for a single date.
 */
export function calculateCandidateSlotsForDate({
  dateStr,
  timeZone,
  workingIntervals,
  durationMinutes,
  bufferBeforeMinutes,
  bufferAfterMinutes,
  slotIntervalMinutes,
  minAdvanceNoticeMinutes,
  existingAppointments,
  referenceTime = new Date(),
}: {
  dateStr: string;
  timeZone: string;
  workingIntervals: WorkingInterval[];
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  slotIntervalMinutes: number;
  minAdvanceNoticeMinutes: number;
  existingAppointments: ExistingAppointmentRange[];
  referenceTime?: Date;
}): TimeSlot[] {
  if (workingIntervals.length === 0 || durationMinutes <= 0) {
    return [];
  }

  const validSlots: TimeSlot[] = [];
  const earliestAllowedUtc = new Date(
    referenceTime.getTime() + minAdvanceNoticeMinutes * 60 * 1000,
  );

  for (const interval of workingIntervals) {
    const intervalStartMin = timeToMinutes(interval.startTime);
    const intervalEndMin = timeToMinutes(interval.endTime);

    for (
      let slotStartMin = intervalStartMin;
      slotStartMin + durationMinutes <= intervalEndMin;
      slotStartMin += slotIntervalMinutes
    ) {
      const blockedStartMin = slotStartMin - bufferBeforeMinutes;
      const blockedEndMin = slotStartMin + durationMinutes + bufferAfterMinutes;

      // Appointment and buffers must fit entirely within this single working interval
      if (blockedStartMin < intervalStartMin || blockedEndMin > intervalEndMin) {
        continue;
      }

      const slotStartTime = minutesToTime(slotStartMin);
      const slotEndTime = minutesToTime(slotStartMin + durationMinutes);

      const slotStartUtc = localToUtc(dateStr, slotStartTime, timeZone);
      const slotEndUtc = localToUtc(dateStr, slotEndTime, timeZone);

      // Check minimum advance notice
      if (slotStartUtc.getTime() < earliestAllowedUtc.getTime()) {
        continue;
      }

      // Blocked range in UTC
      const blockedStartUtc = new Date(slotStartUtc.getTime() - bufferBeforeMinutes * 60 * 1000);
      const blockedEndUtc = new Date(slotEndUtc.getTime() + bufferAfterMinutes * 60 * 1000);

      // Check conflict with existing capacity-reserving appointments
      const hasConflict = existingAppointments.some((appt) =>
        intervalsOverlap(blockedStartUtc, blockedEndUtc, appt.blockedStart, appt.blockedEnd),
      );

      if (!hasConflict) {
        validSlots.push({
          startTime: slotStartTime,
          endTime: slotEndTime,
        });
      }
    }
  }

  return validSlots;
}

/**
 * Loads trusted site settings and active service rows.
 */
async function loadSchedulingContext(serviceIds: string[]) {
  const supabase = createServiceRoleClient();

  const [settingsRes, servicesRes] = await Promise.all([
    supabase.from("site_settings").select("*").single(),
    supabase.from("services").select("*").in("id", serviceIds).eq("is_active", true),
  ]);

  if (settingsRes.error || !settingsRes.data) {
    throw new Error(`Failed to load site settings: ${settingsRes.error?.message}`);
  }

  if (servicesRes.error || !servicesRes.data || servicesRes.data.length === 0) {
    throw new Error("No active services matched the requested IDs");
  }

  if (servicesRes.data.length !== serviceIds.length) {
    throw new Error("One or more requested service IDs are invalid or inactive");
  }

  return {
    settings: settingsRes.data,
    services: servicesRes.data,
  };
}

/**
 * Public service: Computes month availability overview for the calendar grid.
 */
export async function getPublicMonthAvailability({
  year,
  month,
  serviceIds,
  referenceTime = new Date(),
}: {
  year: number;
  month: number;
  serviceIds: string[];
  referenceTime?: Date;
}): Promise<MonthAvailabilitySummary> {
  const timeZone = getConsultationTimeZone();
  const { settings, services } = await loadSchedulingContext(serviceIds);
  const { durationMinutes, bufferBeforeMinutes, bufferAfterMinutes } =
    calculateServiceAggregation(services);

  const supabase = createServiceRoleClient();
  const todayStr = getTodayDateStr(timeZone, referenceTime);
  const horizonEndStr = addDays(todayStr, settings.booking_horizon_days);

  const daysInMonth = getDaysInMonth(year, month);
  const monthStartStr = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEndStr = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  // Load weekly schedules, date overrides, and existing appointments in range
  const [weeklyRes, weeklyIntervalsRes, overridesRes, appointmentsRes] = await Promise.all([
    supabase.from("weekly_availability").select("weekday, is_closed"),
    supabase.from("weekly_availability_intervals").select("weekday, start_time, end_time"),
    supabase
      .from("date_overrides")
      .select("id, override_date, is_closed, date_override_intervals(start_time, end_time)")
      .gte("override_date", monthStartStr)
      .lte("override_date", monthEndStr),
    supabase
      .from("appointments")
      .select("id, blocked_start, blocked_end, status")
      .gte("local_date", monthStartStr)
      .lte("local_date", monthEndStr)
      .eq("reserves_capacity", true),
  ]);

  const weeklyAvailability = new Map<number, boolean>();
  for (const row of weeklyRes.data ?? []) {
    weeklyAvailability.set(row.weekday, row.is_closed);
  }

  const weeklyIntervals = new Map<number, WorkingInterval[]>();
  for (const row of weeklyIntervalsRes.data ?? []) {
    const list = weeklyIntervals.get(row.weekday) ?? [];
    list.push({ startTime: row.start_time.slice(0, 5), endTime: row.end_time.slice(0, 5) });
    weeklyIntervals.set(row.weekday, list);
  }

  const dateOverrides = new Map<string, { isClosed: boolean; overrideId: string }>();
  const dateOverrideIntervals = new Map<string, WorkingInterval[]>();
  for (const row of overridesRes.data ?? []) {
    dateOverrides.set(row.override_date, { isClosed: row.is_closed, overrideId: row.id });
    const intervals: WorkingInterval[] = (row.date_override_intervals ?? []).map((i) => ({
      startTime: i.start_time.slice(0, 5),
      endTime: i.end_time.slice(0, 5),
    }));
    dateOverrideIntervals.set(row.id, intervals);
  }

  const existingAppointments: ExistingAppointmentRange[] = (appointmentsRes.data ?? []).map(
    (a) => ({
      id: a.id,
      blockedStart: new Date(a.blocked_start),
      blockedEnd: new Date(a.blocked_end),
      status: a.status,
    }),
  );

  const days: MonthAvailabilitySummary["days"] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (isBeforeDate(dateStr, todayStr)) {
      days.push({ date: dateStr, status: "past", availableSlotCount: 0 });
      continue;
    }

    if (isAfterDate(dateStr, horizonEndStr)) {
      days.push({ date: dateStr, status: "out_of_horizon", availableSlotCount: 0 });
      continue;
    }

    const [y, m, d] = dateStr.split("-").map(Number);
    const dayOfWeek = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();

    const { isClosed, intervals } = resolveWorkingHoursForDate({
      dateStr,
      weekday: dayOfWeek,
      weeklyAvailability,
      weeklyIntervals,
      dateOverrides,
      dateOverrideIntervals,
    });

    if (isClosed || intervals.length === 0) {
      days.push({ date: dateStr, status: "closed", availableSlotCount: 0 });
      continue;
    }

    const slots = calculateCandidateSlotsForDate({
      dateStr,
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

    if (slots.length > 0) {
      days.push({ date: dateStr, status: "available", availableSlotCount: slots.length });
    } else {
      days.push({ date: dateStr, status: "fully_booked", availableSlotCount: 0 });
    }
  }

  return {
    year,
    month,
    timezone: timeZone,
    bookingHorizonEndDate: horizonEndStr,
    minAdvanceNoticeMinutes: settings.min_advance_notice_minutes,
    days,
  };
}

/**
 * Public service: Computes available start times for a specific date.
 */
export async function getPublicDayAvailability({
  dateStr,
  serviceIds,
  referenceTime = new Date(),
}: {
  dateStr: string;
  serviceIds: string[];
  referenceTime?: Date;
}): Promise<DayAvailability> {
  const timeZone = getConsultationTimeZone();
  const { settings, services } = await loadSchedulingContext(serviceIds);
  const { durationMinutes, bufferBeforeMinutes, bufferAfterMinutes } =
    calculateServiceAggregation(services);

  const todayStr = getTodayDateStr(timeZone, referenceTime);
  const horizonEndStr = addDays(todayStr, settings.booking_horizon_days);

  if (isBeforeDate(dateStr, todayStr)) {
    return {
      date: dateStr,
      status: "past",
      availableSlotCount: 0,
      slots: [],
      totalDurationMinutes: durationMinutes,
      timezone: timeZone,
    };
  }

  if (isAfterDate(dateStr, horizonEndStr)) {
    return {
      date: dateStr,
      status: "out_of_horizon",
      availableSlotCount: 0,
      slots: [],
      totalDurationMinutes: durationMinutes,
      timezone: timeZone,
    };
  }

  const [y, m, d] = dateStr.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();

  const supabase = createServiceRoleClient();
  const [weeklyRes, weeklyIntervalsRes, overrideRes, appointmentsRes] = await Promise.all([
    supabase.from("weekly_availability").select("is_closed").eq("weekday", dayOfWeek).single(),
    supabase
      .from("weekly_availability_intervals")
      .select("start_time, end_time")
      .eq("weekday", dayOfWeek),
    supabase
      .from("date_overrides")
      .select("id, is_closed, date_override_intervals(start_time, end_time)")
      .eq("override_date", dateStr)
      .maybeSingle(),
    supabase
      .from("appointments")
      .select("id, blocked_start, blocked_end, status")
      .eq("local_date", dateStr)
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
    dateOverrides.set(dateStr, {
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
    dateStr,
    weekday: dayOfWeek,
    weeklyAvailability,
    weeklyIntervals,
    dateOverrides,
    dateOverrideIntervals,
  });

  if (isClosed || intervals.length === 0) {
    return {
      date: dateStr,
      status: "closed",
      availableSlotCount: 0,
      slots: [],
      totalDurationMinutes: durationMinutes,
      timezone: timeZone,
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

  const slots = calculateCandidateSlotsForDate({
    dateStr,
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

  return {
    date: dateStr,
    status: slots.length > 0 ? "available" : "fully_booked",
    availableSlotCount: slots.length,
    slots,
    totalDurationMinutes: durationMinutes,
    timezone: timeZone,
  };
}

/**
 * Schedule Change Conflict Checker (PRD & Phase 5 BR-22):
 * Checks whether modifying availability intervals on a date or weekday conflicts with
 * existing booked appointments. Never cancels appointments automatically.
 */
export async function checkScheduleChangeConflicts({
  dateStr,
  weekday,
  proposedIntervals,
}: {
  dateStr?: string;
  weekday?: number;
  proposedIntervals: WorkingInterval[];
}): Promise<{
  hasConflict: boolean;
  conflictingAppointments: {
    appointmentId: string;
    publicReference: string;
    customerName: string;
    appointmentStart: string;
    appointmentEnd: string;
    reason: string;
  }[];
}> {
  const timeZone = getConsultationTimeZone();
  const supabase = createServiceRoleClient();

  let query = supabase
    .from("appointments")
    .select(
      "id, public_reference, customer_name, appointment_start, appointment_end, blocked_start, blocked_end, local_date",
    )
    .eq("reserves_capacity", true);

  if (dateStr) {
    query = query.eq("local_date", dateStr);
  } else if (weekday !== undefined) {
    // Only check future appointments
    const todayStr = getTodayDateStr(timeZone);
    query = query.gte("local_date", todayStr);
  } else {
    throw new Error("Must specify dateStr or weekday to check conflicts");
  }

  const { data: appointments, error } = await query;
  if (error || !appointments) {
    throw new Error(`Failed to check conflicts: ${error?.message}`);
  }

  const conflictingAppointments: {
    appointmentId: string;
    publicReference: string;
    customerName: string;
    appointmentStart: string;
    appointmentEnd: string;
    reason: string;
  }[] = [];

  for (const appt of appointments) {
    if (weekday !== undefined && !dateStr) {
      if (!appt.local_date) continue;
      const [y, m, d] = appt.local_date.split("-").map(Number);
      const apptDow = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
      if (apptDow !== weekday) continue;
    }

    const startLocal = utcToLocal(new Date(appt.appointment_start), timeZone);
    const endLocal = utcToLocal(new Date(appt.appointment_end), timeZone);
    const apptStartMin = timeToMinutes(startLocal.timeStr);
    const apptEndMin = timeToMinutes(endLocal.timeStr);

    const fitsInProposed = proposedIntervals.some((interval) => {
      const intStart = timeToMinutes(interval.startTime);
      const intEnd = timeToMinutes(interval.endTime);
      return apptStartMin >= intStart && apptEndMin <= intEnd;
    });

    if (!fitsInProposed) {
      conflictingAppointments.push({
        appointmentId: appt.id,
        publicReference: appt.public_reference,
        customerName: appt.customer_name,
        appointmentStart: appt.appointment_start,
        appointmentEnd: appt.appointment_end,
        reason: "Appointment falls outside the proposed working hours",
      });
    }
  }

  return {
    hasConflict: conflictingAppointments.length > 0,
    conflictingAppointments,
  };
}
