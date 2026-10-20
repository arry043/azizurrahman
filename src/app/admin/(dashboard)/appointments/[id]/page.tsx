import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminNotesEditor } from "@/components/admin/admin-notes-editor";
import { AppointmentStatusBadge } from "@/components/admin/appointment-status-badge";
import { AppointmentStatusPanel } from "@/components/admin/appointment-status-panel";
import { Card } from "@/components/ui/card";
import { getAdminAppointmentDetail } from "@/lib/admin/appointments-admin-service";
import { requireAdminAuth } from "@/lib/auth/admin-auth";
import { formatTimeForDisplay, utcToLocal } from "@/lib/availability/date-utils";
import { getConsultationTimeZone } from "@/lib/env/server";

export const metadata: Metadata = {
  title: "Appointment Details",
  description: "Review and manage appointment details, status transitions, and audit records.",
  robots: { index: false, follow: false },
};

export const instant = false;

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminAppointmentDetailPage({ params }: DetailPageProps) {
  const { id } = await params;
  const { supabase } = await requireAdminAuth();
  const timeZone = getConsultationTimeZone();

  const appointment = await getAdminAppointmentDetail(supabase, id);

  if (!appointment) {
    notFound();
  }

  const startDate = new Date(appointment.appointment_start);
  const endDate = new Date(appointment.appointment_end);
  const localStart = utcToLocal(startDate, timeZone);
  const localEnd = utcToLocal(endDate, timeZone);

  const displayStartTime = formatTimeForDisplay(localStart.timeStr);
  const displayEndTime = formatTimeForDisplay(localEnd.timeStr);

  const blockedStartDate = new Date(appointment.blocked_start);
  const blockedEndDate = new Date(appointment.blocked_end);
  const localBlockedStart = utcToLocal(blockedStartDate, timeZone);
  const localBlockedEnd = utcToLocal(blockedEndDate, timeZone);

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div>
        <Link
          href="/admin/appointments"
          className="text-foreground-muted inline-flex min-h-[44px] items-center text-xs font-medium transition-colors hover:text-primary"
        >
          ← Back to Appointments
        </Link>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
                {appointment.customer_name}
              </h1>
              <AppointmentStatusBadge status={appointment.status} />
            </div>
            <p className="text-foreground-muted mt-1 font-mono text-xs">
              Reference: <strong className="text-forest">{appointment.public_reference}</strong>
            </p>
          </div>
          <div className="text-foreground-muted text-xs">
            Booked on: {new Date(appointment.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details (2 Columns) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status Lifecycle Actions */}
          <Card className="border-border bg-surface p-4 shadow-card sm:p-5">
            <h2 className="mb-3 text-xs font-semibold tracking-wider text-accent-strong uppercase sm:text-sm">
              Appointment Status Lifecycle
            </h2>
            <AppointmentStatusPanel
              appointmentId={appointment.id}
              currentStatus={appointment.status}
            />
          </Card>

          {/* Client & Contact Information */}
          <Card className="space-y-4 border-border bg-surface p-4 shadow-card sm:p-5">
            <h2 className="border-b border-border/60 pb-2 text-sm font-semibold text-foreground sm:text-base">
              Customer & Contact Information
            </h2>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <span className="text-foreground-muted block text-xs">Full Name</span>
                <span className="font-medium text-foreground">{appointment.customer_name}</span>
              </div>
              <div>
                <span className="text-foreground-muted block text-xs">Phone Number</span>
                <a
                  href={`tel:${appointment.normalized_phone}`}
                  className="inline-flex min-h-[36px] items-center font-medium text-primary hover:underline"
                >
                  {appointment.phone_number}
                </a>
              </div>
              <div>
                <span className="text-foreground-muted block text-xs">Email Address</span>
                {appointment.email ? (
                  <a
                    href={`mailto:${appointment.email}`}
                    className="inline-flex min-h-[36px] items-center font-medium text-primary hover:underline"
                  >
                    {appointment.email}
                  </a>
                ) : (
                  <span className="text-foreground-muted italic">Not provided</span>
                )}
              </div>
              <div>
                <span className="text-foreground-muted block text-xs">
                  Preferred Contact Method
                </span>
                <span className="font-medium text-foreground capitalize">
                  {appointment.preferred_contact_method || "Phone"}
                </span>
              </div>
            </div>

            {appointment.message && (
              <div className="border-t border-border/40 pt-2">
                <span className="text-foreground-muted mb-1 block text-xs">
                  Customer Message / Intake Details
                </span>
                <div className="rounded-md bg-surface-muted/50 p-3 text-sm whitespace-pre-wrap text-foreground">
                  {appointment.message}
                </div>
              </div>
            )}
          </Card>

          {/* Booked Services */}
          <Card className="space-y-4 border-border bg-surface p-4 shadow-card sm:p-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <h2 className="text-sm font-semibold text-foreground sm:text-base">
                Consultation Services
              </h2>
              <span className="text-foreground-muted text-xs">Historical Snapshot</span>
            </div>

            <div className="divide-y divide-border/60">
              {appointment.services.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="text-foreground-muted mr-2 font-mono text-xs">#{idx + 1}</span>
                    <span className="font-medium text-foreground">{s.service_name_snapshot}</span>
                  </div>
                  <div className="text-foreground-muted text-xs">
                    {s.duration_minutes_snapshot} mins
                    {s.buffer_after_minutes_snapshot > 0 &&
                      ` (+${s.buffer_after_minutes_snapshot}m buffer)`}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-foreground-muted/70 pt-2 text-[11px] italic">
              Service details reflect the configuration active at the time of booking and are
              preserved immutably.
            </p>
          </Card>

          {/* Private Administrator Notes */}
          <Card className="space-y-3 border-border bg-surface p-4 shadow-card sm:p-5">
            <h2 className="border-b border-border/60 pb-2 text-sm font-semibold text-foreground sm:text-base">
              Confidential Admin Notes
            </h2>
            <AdminNotesEditor
              appointmentId={appointment.id}
              initialNotes={appointment.private_admin_notes}
            />
          </Card>
        </div>

        {/* Sidebar Info (1 Column) */}
        <div className="space-y-6">
          {/* Timing & Calendar Status */}
          <Card className="space-y-4 border-border bg-surface p-4 shadow-card sm:p-5">
            <h2 className="border-b border-border/60 pb-2 text-xs font-semibold tracking-wider text-accent-strong uppercase sm:text-sm">
              Schedule & Capacity
            </h2>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-foreground-muted block text-xs">Consultation Date</span>
                <span className="font-medium text-foreground">{localStart.dateStr}</span>
              </div>

              <div>
                <span className="text-foreground-muted block text-xs">Consultation Time</span>
                <span className="font-medium text-foreground">
                  {displayStartTime} – {displayEndTime}
                </span>
                <span className="text-foreground-muted block font-mono text-[11px]">
                  ({timeZone})
                </span>
              </div>

              <div>
                <span className="text-foreground-muted block text-xs">Capacity Block Window</span>
                <span className="text-foreground-muted font-mono text-xs">
                  {formatTimeForDisplay(localBlockedStart.timeStr)} –{" "}
                  {formatTimeForDisplay(localBlockedEnd.timeStr)}
                </span>
              </div>

              <div>
                <span className="text-foreground-muted block text-xs">Reserves Capacity</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                  {appointment.reserves_capacity ? (
                    <>
                      <span className="size-2 rounded-full bg-success" />
                      <span className="text-success">Holding Calendar Slot</span>
                    </>
                  ) : (
                    <>
                      <span className="size-2 rounded-full bg-border" />
                      <span className="text-foreground-muted">Slot Released</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </Card>

          {/* Audit Timeline */}
          <Card className="space-y-3 border-border bg-surface p-4 shadow-card sm:p-5">
            <h2 className="border-b border-border/60 pb-2 text-xs font-semibold tracking-wider text-accent-strong uppercase sm:text-sm">
              Audit History
            </h2>

            {appointment.events.length === 0 ? (
              <p className="text-foreground-muted text-xs">No audit events recorded.</p>
            ) : (
              <div className="space-y-3">
                {appointment.events.map((evt) => {
                  const evtDate = new Date(evt.created_at);
                  const local = utcToLocal(evtDate, timeZone);

                  return (
                    <div
                      key={evt.id}
                      className="border-b border-border/40 pb-2.5 last:border-none last:pb-0"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium text-forest capitalize">
                          {evt.event_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-foreground-muted shrink-0 font-mono text-[10px]">
                          {local.dateStr} {local.timeStr}
                        </span>
                      </div>
                      {evt.new_status && (
                        <div className="text-foreground-muted mt-0.5 text-[11px]">
                          Status:{" "}
                          <span className="font-medium text-foreground">{evt.new_status}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
