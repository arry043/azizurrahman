import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { timeToMinutes, utcToLocal } from "@/lib/availability/date-utils";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { Database } from "@/types/database.types";
import {
  WEEKDAYS,
  type AppointmentRow,
  type DateOverrideRow,
  type TableRow,
  type Weekday,
} from "@/types/domain";

export type DateOverrideIntervalRow = TableRow<"date_override_intervals">;

export interface WeeklyScheduleDay {
  weekday: Weekday;
  weekdayName: string;
  is_closed: boolean;
  intervals: { id?: string; start_time: string; end_time: string }[];
}

export interface AdminDateOverrideWithIntervals extends DateOverrideRow {
  intervals: DateOverrideIntervalRow[];
}

export interface ScheduleConflictWarning {
  appointmentId: string;
  publicReference: string;
  customerName: string;
  appointmentStart: string;
  appointmentEnd: string;
  conflictType: "closure" | "outside_hours";
}

/**
 * Validates that an array of intervals has end_time > start_time and no overlaps.
 */
export function validateIntervals(intervals: { start_time: string; end_time: string }[]): void {
  for (const interval of intervals) {
    const startMin = timeToMinutes(interval.start_time);
    const endMin = timeToMinutes(interval.end_time);

    if (endMin <= startMin) {
      throw new AppError("VALIDATION_FAILED", {
        publicMessage: `Invalid interval: start time (${interval.start_time}) must be earlier than end time (${interval.end_time}).`,
      });
    }
  }

  // Check for mutual overlaps
  for (let i = 0; i < intervals.length; i++) {
    const int1 = intervals[i];
    if (!int1) continue;
    const s1 = timeToMinutes(int1.start_time);
    const e1 = timeToMinutes(int1.end_time);

    for (let j = i + 1; j < intervals.length; j++) {
      const int2 = intervals[j];
      if (!int2) continue;
      const s2 = timeToMinutes(int2.start_time);
      const e2 = timeToMinutes(int2.end_time);

      if (s1 < e2 && e1 > s2) {
        throw new AppError("VALIDATION_FAILED", {
          publicMessage: `Overlapping intervals detected: ${int1.start_time}–${int1.end_time} overlaps with ${int2.start_time}–${int2.end_time}.`,
        });
      }
    }
  }
}

/**
 * Retrieves the complete weekly schedule for all 7 days with their operating intervals.
 */
export async function getAdminWeeklySchedule(
  supabase: SupabaseClient<Database>,
): Promise<WeeklyScheduleDay[]> {
  const [daysRes, intervalsRes] = await Promise.all([
    supabase.from("weekly_availability").select("*").order("weekday", { ascending: true }),
    supabase
      .from("weekly_availability_intervals")
      .select("*")
      .order("weekday", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  if (daysRes.error || !daysRes.data) {
    logger.error("get_admin_weekly_schedule_failed", { error: daysRes.error?.message });
    throw new AppError("INTERNAL_ERROR", {
      publicMessage: "Failed to retrieve weekly availability.",
    });
  }

  const intervalsByWeekday: Record<number, { id: string; start_time: string; end_time: string }[]> =
    {};

  for (const item of intervalsRes.data || []) {
    if (!intervalsByWeekday[item.weekday]) {
      intervalsByWeekday[item.weekday] = [];
    }
    // PostgreSQL time column might include seconds (e.g. "10:00:00"), normalize to "HH:mm"
    const start = item.start_time.slice(0, 5);
    const end = item.end_time.slice(0, 5);
    const list = intervalsByWeekday[item.weekday];
    if (list) {
      list.push({
        id: item.id,
        start_time: start,
        end_time: end,
      });
    }
  }

  return daysRes.data.map((row) => ({
    weekday: row.weekday as Weekday,
    weekdayName: WEEKDAYS[row.weekday as Weekday],
    is_closed: row.is_closed,
    intervals: intervalsByWeekday[row.weekday] || [],
  }));
}

/**
 * Updates a single weekday's open/closed status and its non-overlapping time intervals.
 */
export async function updateAdminWeekdaySchedule(
  supabase: SupabaseClient<Database>,
  params: {
    weekday: Weekday;
    isClosed: boolean;
    intervals: { start_time: string; end_time: string }[];
  },
): Promise<void> {
  const { weekday, isClosed, intervals } = params;

  if (!isClosed && intervals.length > 0) {
    validateIntervals(intervals);
  }

  // Update weekly_availability status
  const { error: updateError } = await supabase
    .from("weekly_availability")
    .update({ is_closed: isClosed })
    .eq("weekday", weekday);

  if (updateError) {
    logger.error("update_weekly_availability_failed", { error: updateError.message, weekday });
    throw new AppError("INTERNAL_ERROR", {
      publicMessage: "Failed to update day availability status.",
    });
  }

  // Delete existing intervals
  const { error: deleteError } = await supabase
    .from("weekly_availability_intervals")
    .delete()
    .eq("weekday", weekday);

  if (deleteError) {
    logger.error("delete_weekly_intervals_failed", { error: deleteError.message, weekday });
    throw new AppError("INTERNAL_ERROR", {
      publicMessage: "Failed to reset weekly intervals.",
    });
  }

  // If open and has intervals, insert them
  if (!isClosed && intervals.length > 0) {
    const toInsert = intervals.map((int) => ({
      weekday,
      start_time: int.start_time.length === 5 ? `${int.start_time}:00` : int.start_time,
      end_time: int.end_time.length === 5 ? `${int.end_time}:00` : int.end_time,
    }));

    const { error: insertError } = await supabase
      .from("weekly_availability_intervals")
      .insert(toInsert);

    if (insertError) {
      logger.error("insert_weekly_intervals_failed", { error: insertError.message, weekday });
      throw new AppError("INTERNAL_ERROR", {
        publicMessage: "Failed to save weekly intervals.",
      });
    }
  }

  logger.info("weekly_schedule_updated", { weekday, isClosed, intervalCount: intervals.length });
}

/**
 * Checks for existing active appointments that conflict with proposed weekly availability changes.
 */
export async function checkWeeklyScheduleConflicts(
  supabase: SupabaseClient<Database>,
  params: {
    weekday: Weekday;
    isClosed: boolean;
    intervals: { start_time: string; end_time: string }[];
    timeZone: string;
  },
): Promise<ScheduleConflictWarning[]> {
  const nowIso = new Date().toISOString();

  // Find future active appointments
  const { data: futureApps, error } = await supabase
    .from("appointments")
    .select("*")
    .gte("appointment_start", nowIso)
    .in("status", ["pending", "confirmed"])
    .order("appointment_start", { ascending: true });

  if (error || !futureApps) {
    return [];
  }

  const conflicts: ScheduleConflictWarning[] = [];

  for (const app of futureApps as AppointmentRow[]) {
    const startDate = new Date(app.appointment_start);
    const local = utcToLocal(startDate, params.timeZone);

    if (local.weekday === params.weekday) {
      if (params.isClosed) {
        conflicts.push({
          appointmentId: app.id,
          publicReference: app.public_reference,
          customerName: app.customer_name,
          appointmentStart: app.appointment_start,
          appointmentEnd: app.appointment_end,
          conflictType: "closure",
        });
      } else {
        // Check if appointment start/end falls within any interval
        const appStartMin = local.hours * 60 + local.minutes;
        const appEndDate = new Date(app.appointment_end);
        const localEnd = utcToLocal(appEndDate, params.timeZone);
        const appEndMin = localEnd.hours * 60 + localEnd.minutes;

        const fitsInAnyInterval = params.intervals.some((int) => {
          const intStart = timeToMinutes(int.start_time);
          const intEnd = timeToMinutes(int.end_time);
          return appStartMin >= intStart && appEndMin <= intEnd;
        });

        if (!fitsInAnyInterval) {
          conflicts.push({
            appointmentId: app.id,
            publicReference: app.public_reference,
            customerName: app.customer_name,
            appointmentStart: app.appointment_start,
            appointmentEnd: app.appointment_end,
            conflictType: "outside_hours",
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Retrieves date overrides for a specific date range or all upcoming overrides.
 */
export async function getAdminDateOverrides(
  supabase: SupabaseClient<Database>,
  options?: { month?: string }, // e.g. "2026-10"
): Promise<AdminDateOverrideWithIntervals[]> {
  let query = supabase.from("date_overrides").select("*, intervals:date_override_intervals(*)");

  if (options?.month) {
    const startOfMonth = `${options.month}-01`;
    const endOfMonth = `${options.month}-31`;
    query = query.gte("override_date", startOfMonth).lte("override_date", endOfMonth);
  }

  query = query.order("override_date", { ascending: true });

  const { data, error } = await query;

  if (error) {
    logger.error("get_admin_date_overrides_failed", { error: error.message });
    throw new AppError("INTERNAL_ERROR", {
      publicMessage: "Failed to retrieve date overrides.",
    });
  }

  return ((data as unknown as AdminDateOverrideWithIntervals[]) || []).map((ov) => ({
    ...ov,
    intervals: (ov.intervals || []).sort(
      (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time),
    ),
  }));
}

/**
 * Creates or updates a date override (closure or custom hours) and its intervals.
 */
export async function upsertDateOverride(
  supabase: SupabaseClient<Database>,
  params: {
    overrideDate: string; // YYYY-MM-DD
    isClosed: boolean;
    reason?: string | null;
    intervals: { start_time: string; end_time: string }[];
    userId?: string;
  },
): Promise<DateOverrideRow> {
  const { overrideDate, isClosed, reason, intervals, userId } = params;

  if (!isClosed && intervals.length > 0) {
    validateIntervals(intervals);
  }

  // Upsert the date_override record
  const { data: override, error: upsertError } = await supabase
    .from("date_overrides")
    .upsert(
      {
        override_date: overrideDate,
        is_closed: isClosed,
        reason: reason?.trim() || null,
        created_by: userId,
      },
      { onConflict: "override_date" },
    )
    .select()
    .single();

  if (upsertError || !override) {
    logger.error("upsert_date_override_failed", { error: upsertError?.message, overrideDate });
    throw new AppError("INTERNAL_ERROR", {
      publicMessage: "Failed to save date override.",
    });
  }

  // Delete existing intervals for this override
  await supabase.from("date_override_intervals").delete().eq("date_override_id", override.id);

  // If not closed, insert intervals
  if (!isClosed && intervals.length > 0) {
    const toInsert = intervals.map((int) => ({
      date_override_id: override.id,
      start_time: int.start_time.length === 5 ? `${int.start_time}:00` : int.start_time,
      end_time: int.end_time.length === 5 ? `${int.end_time}:00` : int.end_time,
    }));

    const { error: intError } = await supabase.from("date_override_intervals").insert(toInsert);

    if (intError) {
      logger.error("insert_override_intervals_failed", { error: intError.message });
      throw new AppError("INTERNAL_ERROR", {
        publicMessage: "Failed to save custom hours intervals.",
      });
    }
  }

  logger.info("date_override_upserted", { overrideDate, isClosed });
  return override;
}

/**
 * Deletes a date override.
 */
export async function deleteDateOverride(
  supabase: SupabaseClient<Database>,
  overrideId: string,
): Promise<void> {
  const { error } = await supabase.from("date_overrides").delete().eq("id", overrideId);

  if (error) {
    logger.error("delete_date_override_failed", { error: error.message, overrideId });
    throw new AppError("INTERNAL_ERROR", {
      publicMessage: "Failed to delete date override.",
    });
  }

  logger.info("date_override_deleted", { overrideId });
}

/**
 * Checks for conflicts on a specific calendar date override.
 */
export async function checkDateOverrideConflicts(
  supabase: SupabaseClient<Database>,
  params: {
    overrideDate: string;
    isClosed: boolean;
    intervals: { start_time: string; end_time: string }[];
    timeZone: string;
  },
): Promise<ScheduleConflictWarning[]> {
  const { data: apps, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("local_date", params.overrideDate)
    .in("status", ["pending", "confirmed"])
    .order("appointment_start", { ascending: true });

  if (error || !apps) {
    return [];
  }

  const conflicts: ScheduleConflictWarning[] = [];

  for (const app of apps as AppointmentRow[]) {
    if (params.isClosed) {
      conflicts.push({
        appointmentId: app.id,
        publicReference: app.public_reference,
        customerName: app.customer_name,
        appointmentStart: app.appointment_start,
        appointmentEnd: app.appointment_end,
        conflictType: "closure",
      });
    } else {
      const startDate = new Date(app.appointment_start);
      const local = utcToLocal(startDate, params.timeZone);
      const appStartMin = local.hours * 60 + local.minutes;
      const appEndDate = new Date(app.appointment_end);
      const localEnd = utcToLocal(appEndDate, params.timeZone);
      const appEndMin = localEnd.hours * 60 + localEnd.minutes;

      const fits = params.intervals.some((int) => {
        const s = timeToMinutes(int.start_time);
        const e = timeToMinutes(int.end_time);
        return appStartMin >= s && appEndMin <= e;
      });

      if (!fits) {
        conflicts.push({
          appointmentId: app.id,
          publicReference: app.public_reference,
          customerName: app.customer_name,
          appointmentStart: app.appointment_start,
          appointmentEnd: app.appointment_end,
          conflictType: "outside_hours",
        });
      }
    }
  }

  return conflicts;
}
