"use server";

import { revalidatePath } from "next/cache";

import {
  checkDateOverrideConflicts,
  checkWeeklyScheduleConflicts,
  deleteDateOverride,
  type ScheduleConflictWarning,
  updateAdminWeekdaySchedule,
  upsertDateOverride,
} from "@/lib/admin/availability-admin-service";
import { requireAdminAuth } from "@/lib/auth/admin-auth";
import { getConsultationTimeZone } from "@/lib/env/server";
import type { Weekday } from "@/types/domain";

export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function checkWeekdayConflictsAction(params: {
  weekday: Weekday;
  isClosed: boolean;
  intervals: { start_time: string; end_time: string }[];
}): Promise<ActionResult<ScheduleConflictWarning[]>> {
  try {
    const { supabase } = await requireAdminAuth({ redirectToLogin: false });
    const timeZone = getConsultationTimeZone();

    const conflicts = await checkWeeklyScheduleConflicts(supabase, {
      weekday: params.weekday,
      isClosed: params.isClosed,
      intervals: params.intervals,
      timeZone,
    });

    return { success: true, data: conflicts };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to check conflicts.";
    return { success: false, error: msg };
  }
}

export async function updateWeekdayScheduleAction(params: {
  weekday: Weekday;
  isClosed: boolean;
  intervals: { start_time: string; end_time: string }[];
}): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAuth({ redirectToLogin: false });

    await updateAdminWeekdaySchedule(supabase, {
      weekday: params.weekday,
      isClosed: params.isClosed,
      intervals: params.intervals,
    });

    revalidatePath("/admin/availability");
    revalidatePath("/admin/calendar");
    revalidatePath("/book");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update availability.";
    return { success: false, error: msg };
  }
}

export async function checkDateOverrideConflictsAction(params: {
  overrideDate: string;
  isClosed: boolean;
  intervals: { start_time: string; end_time: string }[];
}): Promise<ActionResult<ScheduleConflictWarning[]>> {
  try {
    const { supabase } = await requireAdminAuth({ redirectToLogin: false });
    const timeZone = getConsultationTimeZone();

    const conflicts = await checkDateOverrideConflicts(supabase, {
      overrideDate: params.overrideDate,
      isClosed: params.isClosed,
      intervals: params.intervals,
      timeZone,
    });

    return { success: true, data: conflicts };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to check date conflicts.";
    return { success: false, error: msg };
  }
}

export async function saveDateOverrideAction(params: {
  overrideDate: string;
  isClosed: boolean;
  reason?: string | null;
  intervals: { start_time: string; end_time: string }[];
}): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireAdminAuth({ redirectToLogin: false });

    await upsertDateOverride(supabase, {
      overrideDate: params.overrideDate,
      isClosed: params.isClosed,
      reason: params.reason,
      intervals: params.intervals,
      userId: user.id,
    });

    revalidatePath("/admin/calendar");
    revalidatePath("/admin/availability");
    revalidatePath("/book");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save date override.";
    return { success: false, error: msg };
  }
}

export async function deleteDateOverrideAction(overrideId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAuth({ redirectToLogin: false });

    await deleteDateOverride(supabase, overrideId);

    revalidatePath("/admin/calendar");
    revalidatePath("/admin/availability");
    revalidatePath("/book");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete date override.";
    return { success: false, error: msg };
  }
}
