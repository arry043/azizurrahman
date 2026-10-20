import type { Metadata } from "next";
import Link from "next/link";

import { AppointmentStatusBadge } from "@/components/admin/appointment-status-badge";
import { Card } from "@/components/ui/card";
import { CalendarIcon, ClockIcon } from "@/components/ui/icons";
import { getDashboardOverviewMetrics } from "@/lib/admin/appointments-admin-service";
import { requireAdminAuth } from "@/lib/auth/admin-auth";
import { formatTimeForDisplay, utcToLocal } from "@/lib/availability/date-utils";
import { getConsultationTimeZone } from "@/lib/env/server";

export const metadata: Metadata = {
  title: "Admin Dashboard Overview",
  description: "Operational summary of consultations, upcoming bookings, and calendar status.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminDashboardPage() {
  const { supabase, profile } = await requireAdminAuth();
  const timeZone = getConsultationTimeZone();
  const metrics = await getDashboardOverviewMetrics(supabase);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
            Welcome back, {profile.display_name || "Admin"}
          </h1>
          <p className="text-foreground-muted mt-1 text-xs sm:text-sm">
            Overview of appointment bookings, operational metrics, and recent administrative
            actions.
          </p>
        </div>
        <div className="flex items-center">
          <Link
            href="/admin/appointments"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover sm:w-auto"
          >
            Manage Appointments
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {/* Pending Action */}
        <Card className="border-border bg-surface p-3.5 shadow-card sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-warning uppercase sm:text-xs">
              Pending Review
            </span>
            <span className="flex size-6 items-center justify-center rounded-full bg-warning/15 font-mono text-xs text-warning sm:size-7">
              !
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between sm:mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {metrics.counts.pending}
            </span>
            <Link
              href="/admin/appointments?status=pending"
              className="text-[11px] font-medium text-warning hover:underline sm:text-xs"
            >
              Review →
            </Link>
          </div>
        </Card>

        {/* Confirmed Appointments */}
        <Card className="border-border bg-surface p-3.5 shadow-card sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-success uppercase sm:text-xs">
              Confirmed
            </span>
            <span className="flex size-6 items-center justify-center rounded-full bg-emerald/10 text-emerald sm:size-7">
              ✓
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between sm:mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {metrics.counts.confirmed}
            </span>
            <Link
              href="/admin/appointments?status=confirmed"
              className="text-[11px] font-medium text-emerald hover:underline sm:text-xs"
            >
              View →
            </Link>
          </div>
        </Card>

        {/* Upcoming Consultations */}
        <Card className="border-border bg-surface p-3.5 shadow-card sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-accent-strong uppercase sm:text-xs">
              Upcoming
            </span>
            <span className="flex size-6 items-center justify-center rounded-full bg-accent/20 text-accent-strong sm:size-7">
              ★
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between sm:mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {metrics.counts.upcoming}
            </span>
            <span className="text-foreground-muted text-[11px] sm:text-xs">Future slots</span>
          </div>
        </Card>

        {/* Reschedule Requested */}
        <Card className="border-border bg-surface p-3.5 shadow-card sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted text-[10px] font-semibold tracking-wider uppercase sm:text-xs">
              Reschedules
            </span>
            <span className="text-foreground-muted flex size-6 items-center justify-center rounded-full bg-surface-muted sm:size-7">
              ↺
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between sm:mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {metrics.counts.reschedule_requested}
            </span>
            <Link
              href="/admin/appointments?status=reschedule_requested"
              className="text-foreground-muted text-[11px] font-medium hover:underline sm:text-xs"
            >
              Filter →
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick Action Banner */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        <Link
          href="/admin/availability"
          className="group flex flex-col justify-between rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/50 hover:bg-surface-muted/50"
        >
          <div>
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary">
              Regular Weekly Availability
            </h3>
            <p className="text-foreground-muted mt-1 text-xs">
              Configure standard consultation windows and operating days for the week.
            </p>
          </div>
          <span className="mt-3 text-xs font-medium text-primary">Edit Schedule →</span>
        </Link>

        <Link
          href="/admin/calendar"
          className="group flex flex-col justify-between rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/50 hover:bg-surface-muted/50"
        >
          <div>
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary">
              Date Overrides & Closures
            </h3>
            <p className="text-foreground-muted mt-1 text-xs">
              Block specific holidays, leave dates, or open one-off custom booking hours.
            </p>
          </div>
          <span className="mt-3 text-xs font-medium text-primary">Manage Overrides →</span>
        </Link>

        <Link
          href="/admin/services"
          className="group flex flex-col justify-between rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/50 hover:bg-surface-muted/50"
        >
          <div>
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary">
              Consultation Services
            </h3>
            <p className="text-foreground-muted mt-1 text-xs">
              Manage consultation types, active offerings, durations, and booking buffers.
            </p>
          </div>
          <span className="mt-3 text-xs font-medium text-primary">View Services →</span>
        </Link>
      </div>

      {/* Two Column Layout: Recent Appointments & Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Recent Appointments (2 Columns) */}
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              Recent Appointments
            </h2>
            <Link
              href="/admin/appointments"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all ({metrics.counts.total}) →
            </Link>
          </div>

          <Card className="overflow-hidden border-border bg-surface shadow-card">
            {metrics.recentAppointments.length === 0 ? (
              <div className="text-foreground-muted p-8 text-center text-sm">
                No appointment bookings recorded yet.
              </div>
            ) : (
              <>
                {/* Mobile Card List: visible on screens < sm */}
                <div className="divide-y divide-border/60 sm:hidden">
                  {metrics.recentAppointments.map((app) => {
                    const startDate = new Date(app.appointment_start);
                    const local = utcToLocal(startDate, timeZone);
                    const displayTime = formatTimeForDisplay(local.timeStr);
                    const serviceNames =
                      app.services.map((s) => s.service_name_snapshot).join(", ") || "Consultation";

                    return (
                      <div
                        key={app.id}
                        className="space-y-2.5 p-3.5 transition-colors hover:bg-surface-muted/30"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {app.customer_name}
                            </p>
                            <p className="font-mono text-xs font-medium text-forest">
                              {app.public_reference}
                            </p>
                          </div>
                          <AppointmentStatusBadge status={app.status} />
                        </div>

                        <div className="text-foreground-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          <span className="inline-flex items-center gap-1">
                            <CalendarIcon className="size-3.5 shrink-0 text-accent-strong" />
                            <span className="font-medium text-foreground">{local.dateStr}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon className="size-3.5 shrink-0 text-accent-strong" />
                            <span>{displayTime}</span>
                          </span>
                        </div>

                        <div className="text-foreground-muted truncate text-xs">
                          Service: <span className="text-foreground">{serviceNames}</span>
                        </div>

                        <div className="pt-1">
                          <Link
                            href={`/admin/appointments/${app.id}`}
                            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-xs font-semibold text-primary shadow-xs transition-colors hover:bg-surface-muted active:bg-surface-muted/80"
                          >
                            View Appointment Details →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table: visible on screens >= sm */}
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full text-left text-sm" aria-label="Recent appointments">
                    <thead className="text-foreground-muted border-b border-border bg-surface-muted/60 text-xs font-semibold uppercase">
                      <tr>
                        <th scope="col" className="px-4 py-3">
                          Customer & Reference
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Date & Time
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Services
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-3 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {metrics.recentAppointments.map((app) => {
                        const startDate = new Date(app.appointment_start);
                        const local = utcToLocal(startDate, timeZone);
                        const displayTime = formatTimeForDisplay(local.timeStr);

                        return (
                          <tr key={app.id} className="transition-colors hover:bg-surface-muted/40">
                            <td className="px-4 py-3.5">
                              <div className="font-medium text-foreground">{app.customer_name}</div>
                              <div className="text-foreground-muted font-mono text-xs">
                                {app.public_reference}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-medium text-foreground">{local.dateStr}</div>
                              <div className="text-foreground-muted text-xs">{displayTime}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="max-w-[160px] truncate text-xs text-foreground">
                                {app.services.map((s) => s.service_name_snapshot).join(", ") ||
                                  "Consultation"}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <AppointmentStatusBadge status={app.status} />
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <Link
                                href={`/admin/appointments/${app.id}`}
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                Details
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Audit Timeline / Activity Feed (1 Column) */}
        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground sm:text-lg">Recent Activity</h2>
            <span className="text-foreground-muted text-xs">Database Audit</span>
          </div>

          <Card className="border-border bg-surface p-3.5 shadow-card sm:p-4">
            {metrics.recentEvents.length === 0 ? (
              <p className="text-foreground-muted py-6 text-center text-xs">
                No recent activity logged.
              </p>
            ) : (
              <ul className="space-y-3" aria-label="Recent audit events">
                {metrics.recentEvents.map((evt) => {
                  const evtDate = new Date(evt.created_at);
                  const local = utcToLocal(evtDate, timeZone);

                  return (
                    <li
                      key={evt.id}
                      className="border-b border-border/40 pb-2.5 last:border-none last:pb-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium tracking-wider text-forest uppercase">
                          {evt.event_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-foreground-muted shrink-0 font-mono text-[11px]">
                          {local.dateStr} {local.timeStr}
                        </span>
                      </div>
                      {evt.new_status && (
                        <div className="text-foreground-muted mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                          <span>Status:</span>
                          <span className="font-semibold text-foreground">{evt.new_status}</span>
                          {evt.previous_status && (
                            <span className="text-foreground-muted/70 text-[11px]">
                              (from {evt.previous_status})
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
