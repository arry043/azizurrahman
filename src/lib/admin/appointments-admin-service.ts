import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { canTransition } from "@/lib/booking/status";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { Database } from "@/types/database.types";
import type {
  AppointmentRow,
  AppointmentServiceRow,
  AppointmentStatus,
  TableRow,
} from "@/types/domain";

export type AppointmentEventRow = TableRow<"appointment_events">;

export interface AdminAppointmentSummary extends AppointmentRow {
  services: AppointmentServiceRow[];
}

export interface AdminAppointmentDetail extends AppointmentRow {
  services: AppointmentServiceRow[];
  events: AppointmentEventRow[];
}

export interface OverviewMetrics {
  counts: {
    pending: number;
    confirmed: number;
    reschedule_requested: number;
    declined: number;
    cancelled: number;
    total: number;
    upcoming: number;
  };
  recentAppointments: AdminAppointmentSummary[];
  recentEvents: AppointmentEventRow[];
}

export interface AppointmentListParams {
  search?: string;
  status?: AppointmentStatus | "all";
  date?: string;
  serviceId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "appointment_start" | "created_at";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedAppointmentsResult {
  appointments: AdminAppointmentSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Fetches dashboard overview metrics: counts, upcoming appointments, and recent activity.
 */
export async function getDashboardOverviewMetrics(
  supabase: SupabaseClient<Database>,
): Promise<OverviewMetrics> {
  const nowIso = new Date().toISOString();

  // Run metric count queries in parallel
  const [
    pendingRes,
    confirmedRes,
    rescheduleRes,
    declinedRes,
    cancelledRes,
    totalRes,
    upcomingRes,
    recentAppointmentsRes,
    recentEventsRes,
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed"),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "reschedule_requested"),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "declined"),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "cancelled"),
    supabase.from("appointments").select("*", { count: "exact", head: true }),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("appointment_start", nowIso)
      .in("status", ["pending", "confirmed"]),
    supabase
      .from("appointments")
      .select("*, services:appointment_services(*)")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("appointment_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const recentAppointments: AdminAppointmentSummary[] = (
    (recentAppointmentsRes.data as unknown as AdminAppointmentSummary[]) || []
  ).map((app) => ({
    ...app,
    services: (app.services || []).sort((a, b) => a.position - b.position),
  }));

  return {
    counts: {
      pending: pendingRes.count ?? 0,
      confirmed: confirmedRes.count ?? 0,
      reschedule_requested: rescheduleRes.count ?? 0,
      declined: declinedRes.count ?? 0,
      cancelled: cancelledRes.count ?? 0,
      total: totalRes.count ?? 0,
      upcoming: upcomingRes.count ?? 0,
    },
    recentAppointments,
    recentEvents: (recentEventsRes.data as AppointmentEventRow[]) || [],
  };
}

/**
 * Searchable, filterable, paginated query for appointments.
 */
export async function getAdminAppointmentsList(
  supabase: SupabaseClient<Database>,
  params: AppointmentListParams = {},
): Promise<PaginatedAppointmentsResult> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize || 10));
  const offset = (page - 1) * pageSize;
  const sortBy = params.sortBy || "appointment_start";
  const sortOrder = params.sortOrder || "desc";

  let query = supabase
    .from("appointments")
    .select("*, services:appointment_services(*)", { count: "exact" });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.date) {
    query = query.eq("local_date", params.date);
  }

  if (params.search && params.search.trim()) {
    const q = params.search.trim();
    // Crockford reference or partial text search
    query = query.or(
      `public_reference.ilike.%${q}%,customer_name.ilike.%${q}%,normalized_phone.ilike.%${q}%,email.ilike.%${q}%`,
    );
  }

  query = query
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    logger.error("admin_appointments_list_query_failed", { error: error.message });
    throw new AppError("INTERNAL_ERROR", {
      publicMessage: "Failed to retrieve appointments.",
    });
  }

  let appointments: AdminAppointmentSummary[] = (
    (data as unknown as AdminAppointmentSummary[]) || []
  ).map((app) => ({
    ...app,
    services: (app.services || []).sort((a, b) => a.position - b.position),
  }));

  // Optional client-side service filter if requested
  if (params.serviceId) {
    appointments = appointments.filter((app) =>
      app.services.some((s) => s.service_id === params.serviceId),
    );
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    appointments,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Retrieves full details for a single appointment, including service snapshots and audit timeline.
 */
export async function getAdminAppointmentDetail(
  supabase: SupabaseClient<Database>,
  appointmentId: string,
): Promise<AdminAppointmentDetail | null> {
  const [appRes, servicesRes, eventsRes] = await Promise.all([
    supabase.from("appointments").select("*").eq("id", appointmentId).maybeSingle(),
    supabase
      .from("appointment_services")
      .select("*")
      .eq("appointment_id", appointmentId)
      .order("position", { ascending: true }),
    supabase
      .from("appointment_events")
      .select("*")
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: false }),
  ]);

  if (appRes.error || !appRes.data) {
    return null;
  }

  return {
    ...appRes.data,
    services: servicesRes.data || [],
    events: (eventsRes.data as AppointmentEventRow[]) || [],
  };
}

/**
 * Transitions appointment status with concurrency and business rules validation.
 */
export async function updateAppointmentStatus(
  supabase: SupabaseClient<Database>,
  params: {
    appointmentId: string;
    newStatus: AppointmentStatus;
    expectedCurrentStatus?: AppointmentStatus;
    reason?: string;
  },
): Promise<AppointmentRow> {
  // Fetch current appointment to verify state
  const { data: currentApp, error: fetchError } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", params.appointmentId)
    .single();

  if (fetchError || !currentApp) {
    throw new AppError("NOT_FOUND", { publicMessage: "Appointment not found." });
  }

  if (params.expectedCurrentStatus && currentApp.status !== params.expectedCurrentStatus) {
    throw new AppError("INVALID_STATUS_TRANSITION", {
      publicMessage: `The appointment status has already changed to '${currentApp.status}'. Please refresh the page.`,
    });
  }

  if (!canTransition(currentApp.status, params.newStatus)) {
    throw new AppError("INVALID_STATUS_TRANSITION", {
      publicMessage: `Cannot transition appointment from '${currentApp.status}' to '${params.newStatus}'.`,
    });
  }

  const { data: updatedApp, error: updateError } = await supabase
    .from("appointments")
    .update({
      status: params.newStatus,
    })
    .eq("id", params.appointmentId)
    .select()
    .single();

  if (updateError || !updatedApp) {
    logger.error("admin_appointment_status_update_failed", {
      appointmentId: params.appointmentId,
      error: updateError?.message,
    });
    throw new AppError("INVALID_STATUS_TRANSITION", {
      publicMessage: updateError?.message || "Failed to update appointment status.",
    });
  }

  logger.info("admin_appointment_status_updated", {
    appointmentId: params.appointmentId,
    previousStatus: currentApp.status,
    newStatus: params.newStatus,
    reason: params.reason ? "[PROVIDED]" : undefined,
  });

  return updatedApp;
}

/**
 * Updates private internal administrator notes.
 */
export async function updateAppointmentNotes(
  supabase: SupabaseClient<Database>,
  appointmentId: string,
  notes: string | null,
): Promise<AppointmentRow> {
  const trimmed = notes ? notes.trim() : null;
  if (trimmed && trimmed.length > 5000) {
    throw new AppError("VALIDATION_FAILED", {
      publicMessage: "Admin notes cannot exceed 5,000 characters.",
      fieldErrors: {
        notes: ["Maximum note length is 5,000 characters."],
      },
    });
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({
      private_admin_notes: trimmed,
    })
    .eq("id", appointmentId)
    .select()
    .single();

  if (error || !data) {
    logger.error("admin_appointment_notes_update_failed", {
      appointmentId,
      error: error?.message,
    });
    throw new AppError("INTERNAL_ERROR", { publicMessage: "Failed to update notes." });
  }

  logger.info("admin_appointment_notes_updated", { appointmentId });
  return data;
}
