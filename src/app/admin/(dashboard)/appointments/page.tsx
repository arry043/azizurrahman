import type { Metadata } from "next";
import Link from "next/link";

import { AppointmentsFilterBar } from "@/components/admin/appointments-filter-bar";
import { AppointmentStatusBadge } from "@/components/admin/appointment-status-badge";
import { Card } from "@/components/ui/card";
import { CalendarIcon, ClockIcon } from "@/components/ui/icons";
import { getAdminAppointmentsList } from "@/lib/admin/appointments-admin-service";
import { requireAdminAuth } from "@/lib/auth/admin-auth";
import { formatTimeForDisplay, utcToLocal } from "@/lib/availability/date-utils";
import { getConsultationTimeZone } from "@/lib/env/server";
import type { AppointmentStatus } from "@/types/domain";

export const metadata: Metadata = {
  title: "Manage Appointments",
  description: "Search, filter, and review consultation appointment bookings.",
  robots: { index: false, follow: false },
};

export const instant = false;

interface AppointmentsPageProps {
  searchParams?: Promise<{
    search?: string;
    status?: string;
    date?: string;
    page?: string;
  }>;
}

export default async function AdminAppointmentsPage({ searchParams }: AppointmentsPageProps) {
  const { supabase } = await requireAdminAuth();
  const timeZone = getConsultationTimeZone();

  const resolved = searchParams ? await searchParams : {};
  const search = resolved?.search || "";
  const status = (resolved?.status as AppointmentStatus | "all") || "all";
  const date = resolved?.date || "";
  const currentPage = Math.max(1, Number(resolved?.page) || 1);
  const pageSize = 15;

  const result = await getAdminAppointmentsList(supabase, {
    search,
    status,
    date,
    page: currentPage,
    pageSize,
  });

  const { appointments, totalCount, totalPages } = result;

  // Pagination URL helper
  function buildPageUrl(targetPage: number) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status && status !== "all") params.set("status", status);
    if (date) params.set("date", date);
    params.set("page", String(targetPage));
    return `/admin/appointments?${params.toString()}`;
  }

  const startIdx = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(totalCount, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
            Appointments
          </h1>
          <p className="text-foreground-muted mt-0.5 text-xs sm:text-sm">
            Manage incoming bookings, status confirmations, reschedules, and client inquiries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-foreground-muted text-xs font-semibold">
            Total records: <strong className="text-foreground">{totalCount}</strong>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <AppointmentsFilterBar initialSearch={search} initialStatus={status} initialDate={date} />

      {/* Content Container */}
      <Card className="overflow-hidden border-border bg-surface shadow-card">
        {appointments.length === 0 ? (
          <div className="p-8 text-center sm:p-12">
            <p className="text-base font-semibold text-foreground">No appointments found</p>
            <p className="text-foreground-muted mt-1 text-xs sm:text-sm">
              Try adjusting your search criteria or filter selections.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (screens < sm) */}
            <div className="divide-y divide-border/60 sm:hidden">
              {appointments.map((app) => {
                const startDate = new Date(app.appointment_start);
                const local = utcToLocal(startDate, timeZone);
                const displayTime = formatTimeForDisplay(local.timeStr);
                const serviceNames =
                  app.services.map((s) => s.service_name_snapshot).join(", ") || "Consultation";

                return (
                  <div
                    key={app.id}
                    className="space-y-3 p-4 transition-colors hover:bg-surface-muted/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-forest">
                        {app.public_reference}
                      </span>
                      <AppointmentStatusBadge status={app.status} />
                    </div>

                    <div>
                      <h2 className="text-sm font-semibold text-foreground">{app.customer_name}</h2>
                      <div className="text-foreground-muted mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                        <a
                          href={`tel:${app.normalized_phone}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {app.phone_number}
                        </a>
                        {app.email && (
                          <>
                            <span>·</span>
                            <a
                              href={`mailto:${app.email}`}
                              className="max-w-[180px] truncate hover:underline"
                            >
                              {app.email}
                            </a>
                          </>
                        )}
                      </div>
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

                    <div className="text-foreground-muted text-xs">
                      <span className="font-medium text-foreground">Services:</span> {serviceNames}
                    </div>

                    <div className="pt-1">
                      <Link
                        href={`/admin/appointments/${app.id}`}
                        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-xs font-semibold text-primary shadow-xs transition-colors hover:bg-surface-muted active:bg-surface-muted/80"
                      >
                        View / Edit Appointment Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (screens >= sm) */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm" aria-label="Appointments list">
                <thead className="text-foreground-muted border-b border-border bg-surface-muted/60 text-xs font-semibold uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3.5">
                      Reference
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Client & Contact
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Date & Time
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Service(s)
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {appointments.map((app) => {
                    const startDate = new Date(app.appointment_start);
                    const local = utcToLocal(startDate, timeZone);
                    const displayTime = formatTimeForDisplay(local.timeStr);

                    return (
                      <tr key={app.id} className="transition-colors hover:bg-surface-muted/40">
                        <td className="px-4 py-4 font-mono text-xs font-bold text-forest">
                          {app.public_reference}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-foreground">{app.customer_name}</div>
                          <div className="text-foreground-muted text-xs">
                            {app.phone_number}
                            {app.email && ` · ${app.email}`}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-foreground">{local.dateStr}</div>
                          <div className="text-foreground-muted text-xs">{displayTime}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-[200px] truncate text-xs text-foreground">
                            {app.services.map((s) => s.service_name_snapshot).join(", ") ||
                              "Consultation"}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <AppointmentStatusBadge status={app.status} />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Link
                            href={`/admin/appointments/${app.id}`}
                            className="inline-flex min-h-[36px] items-center rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-primary shadow-xs transition-colors hover:bg-surface-muted"
                          >
                            View / Edit
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

        {/* Pagination controls */}
        {totalCount > 0 && (
          <div className="text-foreground-muted flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs sm:flex-row">
            <div>
              Showing <span className="font-medium text-foreground">{startIdx}</span> to{" "}
              <span className="font-medium text-foreground">{endIdx}</span> of{" "}
              <span className="font-medium text-foreground">{totalCount}</span> results
            </div>

            <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
              {currentPage > 1 ? (
                <Link
                  href={buildPageUrl(currentPage - 1)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border bg-surface px-4 py-2 font-medium text-foreground shadow-xs transition-colors hover:bg-surface-muted sm:min-h-[32px] sm:px-3 sm:py-1"
                >
                  Previous
                </Link>
              ) : (
                <span className="text-foreground-muted/50 inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-md border border-border/40 bg-surface-muted/50 px-4 py-2 sm:min-h-[32px] sm:px-3 sm:py-1">
                  Previous
                </span>
              )}

              <span className="text-xs">
                Page <strong className="text-foreground">{currentPage}</strong> of{" "}
                <strong className="text-foreground">{totalPages}</strong>
              </span>

              {currentPage < totalPages ? (
                <Link
                  href={buildPageUrl(currentPage + 1)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border bg-surface px-4 py-2 font-medium text-foreground shadow-xs transition-colors hover:bg-surface-muted sm:min-h-[32px] sm:px-3 sm:py-1"
                >
                  Next
                </Link>
              ) : (
                <span className="text-foreground-muted/50 inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-md border border-border/40 bg-surface-muted/50 px-4 py-2 sm:min-h-[32px] sm:px-3 sm:py-1">
                  Next
                </span>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
