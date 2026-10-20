"use server";

import { revalidatePath } from "next/cache";

import {
  updateAppointmentNotes,
  updateAppointmentStatus,
} from "@/lib/admin/appointments-admin-service";
import { requireAdminAuth } from "@/lib/auth/admin-auth";
import type { AppointmentStatus } from "@/types/domain";

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function updateAppointmentStatusAction(params: {
  appointmentId: string;
  newStatus: AppointmentStatus;
  expectedCurrentStatus?: AppointmentStatus;
  reason?: string;
}): Promise<ActionResponse> {
  try {
    const { supabase } = await requireAdminAuth({ redirectToLogin: false });

    await updateAppointmentStatus(supabase, {
      appointmentId: params.appointmentId,
      newStatus: params.newStatus,
      expectedCurrentStatus: params.expectedCurrentStatus,
      reason: params.reason,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/appointments");
    revalidatePath(`/admin/appointments/${params.appointmentId}`);

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update appointment status.";
    return { success: false, error: message };
  }
}

export async function updateAppointmentNotesAction(params: {
  appointmentId: string;
  notes: string;
}): Promise<ActionResponse> {
  try {
    const { supabase } = await requireAdminAuth({ redirectToLogin: false });

    await updateAppointmentNotes(supabase, params.appointmentId, params.notes);

    revalidatePath(`/admin/appointments/${params.appointmentId}`);

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update internal notes.";
    return { success: false, error: message };
  }
}
