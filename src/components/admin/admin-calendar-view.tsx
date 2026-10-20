"use client";

import Link from "next/link";
import { useState } from "react";

import { CalendarOverrideManager } from "@/components/admin/calendar-override-manager";
import { Card } from "@/components/ui/card";
import type {
  AdminDateOverrideWithIntervals,
  WeeklyScheduleDay,
} from "@/lib/admin/availability-admin-service";
import type { AppointmentRow } from "@/types/domain";

interface CalendarViewProps {
  monthName: string;
  year: number;
  monthIndex: number; // 0..11
  daysInMonth: number;
  startWeekday: number; // 0..6
  overrides: AdminDateOverrideWithIntervals[];
  appointments: AppointmentRow[];
  weeklySchedule: WeeklyScheduleDay[];
}

export function AdminCalendarView({
  monthName,
  year,
  monthIndex,
  daysInMonth,
  startWeekday,
  overrides,
  appointments,
  weeklySchedule,
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Month navigation URLs
  const prevDate = new Date(Date.UTC(year, monthIndex - 1, 1));
  const prevMonthStr = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, "0")}`;

  const nextDate = new Date(Date.UTC(year, monthIndex + 1, 1));
  const nextMonthStr = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, "0")}`;

  // Index overrides by date
  const overrideMap = new Map<string, AdminDateOverrideWithIntervals>();
  for (const ov of overrides) {
    overrideMap.set(ov.override_date, ov);
  }

  // Index appointments by local date
  const appointmentsByDate = new Map<string, AppointmentRow[]>();
  for (const app of appointments) {
    const d = app.local_date;
    if (d) {
      if (!appointmentsByDate.has(d)) appointmentsByDate.set(d, []);
      appointmentsByDate.get(d)!.push(app);
    }
  }

  // Index weekly closed days
  const weeklyClosed = new Set<number>();
  for (const d of weeklySchedule) {
    if (d.is_closed) weeklyClosed.add(d.weekday);
  }

  const selectedOverride = selectedDate ? (overrideMap.get(selectedDate) ?? null) : null;
  const selectedApps = selectedDate ? (appointmentsByDate.get(selectedDate) ?? []) : [];

  return (
    <div className="space-y-6">
      {/* Month Navigation Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-lg font-bold text-foreground sm:text-xl">
            {monthName} {year}
          </h2>
          <p className="text-foreground-muted mt-0.5 text-xs">
            Tap any day to configure closures, manage custom hours, or inspect bookings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/calendar?month=${prevMonthStr}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-surface-muted sm:min-h-[36px]"
          >
            ← Previous
          </Link>
          <Link
            href={`/admin/calendar?month=${nextMonthStr}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-surface-muted sm:min-h-[36px]"
          >
            Next →
          </Link>
        </div>
      </div>

      {/* Override Editor (Active when a date is selected) */}
      {selectedDate && (
        <CalendarOverrideManager
          dateStr={selectedDate}
          existingOverride={selectedOverride}
          dayAppointments={selectedApps}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {/* Calendar Grid Card */}
      <Card className="overflow-hidden border-border bg-surface shadow-card">
        {/* Day of Week Headers */}
        <div className="text-foreground-muted grid grid-cols-7 border-b border-border bg-surface-muted/60 py-2.5 text-center text-xs font-semibold uppercase">
          <span>
            <span className="sm:hidden">S</span>
            <span className="hidden sm:inline">Sun</span>
          </span>
          <span>
            <span className="sm:hidden">M</span>
            <span className="hidden sm:inline">Mon</span>
          </span>
          <span>
            <span className="sm:hidden">T</span>
            <span className="hidden sm:inline">Tue</span>
          </span>
          <span>
            <span className="sm:hidden">W</span>
            <span className="hidden sm:inline">Wed</span>
          </span>
          <span>
            <span className="sm:hidden">T</span>
            <span className="hidden sm:inline">Thu</span>
          </span>
          <span>
            <span className="sm:hidden">F</span>
            <span className="hidden sm:inline">Fri</span>
          </span>
          <span>
            <span className="sm:hidden">S</span>
            <span className="hidden sm:inline">Sat</span>
          </span>
        </div>

        {/* Calendar Days Grid */}
        <div className="grid auto-rows-fr grid-cols-7 divide-x divide-y divide-border/60">
          {/* Empty prefix cells */}
          {Array.from({ length: startWeekday }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-16 bg-surface-muted/20 p-1 sm:min-h-24 sm:p-2"
            />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const weekday = (startWeekday + i) % 7;

            const override = overrideMap.get(dayStr);
            const isWeeklyClosed = weeklyClosed.has(weekday);
            const isClosed = override ? override.is_closed : isWeeklyClosed;

            const dayApps = appointmentsByDate.get(dayStr) || [];
            const isSelected = selectedDate === dayStr;

            return (
              <button
                key={dayStr}
                type="button"
                onClick={() => setSelectedDate(dayStr)}
                className={`flex min-h-16 flex-col justify-between p-1 text-left transition-colors hover:bg-emerald/10 focus-visible:outline-2 focus-visible:outline-primary sm:min-h-24 sm:p-2 ${
                  isSelected
                    ? "bg-accent/15 ring-2 ring-accent"
                    : isClosed
                      ? "bg-surface-muted/40"
                      : ""
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={`flex size-5 items-center justify-center rounded-full text-[11px] font-semibold sm:size-6 sm:text-xs ${
                      isSelected ? "bg-primary text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {dayNum}
                  </span>

                  {override && (
                    <>
                      <span
                        className={`hidden rounded px-1.5 py-0.5 text-[10px] font-bold sm:inline-block ${
                          override.is_closed
                            ? "bg-error/15 text-error"
                            : "bg-accent/20 text-accent-strong"
                        }`}
                      >
                        {override.is_closed ? "Closed" : "Custom"}
                      </span>
                      <span
                        className={`size-1.5 rounded-full sm:hidden ${
                          override.is_closed ? "bg-error" : "bg-accent-strong"
                        }`}
                        title={override.is_closed ? "Closed" : "Custom"}
                      />
                    </>
                  )}
                </div>

                <div className="mt-1 w-full space-y-0.5 sm:mt-2 sm:space-y-1">
                  {dayApps.length > 0 && (
                    <>
                      <span className="hidden truncate rounded bg-emerald/10 px-1.5 py-0.5 text-[11px] font-medium text-forest sm:block">
                        {dayApps.length} consultation{dayApps.length === 1 ? "" : "s"}
                      </span>
                      <span
                        className="mx-auto flex size-4 items-center justify-center rounded-full bg-emerald/20 text-[9px] font-bold text-forest sm:hidden"
                        title={`${dayApps.length} consultation(s)`}
                      >
                        {dayApps.length}
                      </span>
                    </>
                  )}

                  {!override && isWeeklyClosed && (
                    <span className="text-foreground-muted/70 hidden truncate text-[10px] italic sm:block">
                      Weekly Closed
                    </span>
                  )}

                  {override?.reason && (
                    <span
                      className="text-foreground-muted hidden truncate text-[10px] sm:block"
                      title={override.reason}
                    >
                      {override.reason}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* List of active overrides this month */}
      {overrides.length > 0 && (
        <Card className="space-y-3 border-border bg-surface p-4 shadow-card">
          <h3 className="text-sm font-semibold text-foreground">
            Overrides in {monthName} ({overrides.length})
          </h3>
          <div className="divide-y divide-border/60">
            {overrides.map((ov) => (
              <div
                key={ov.id}
                className="flex flex-col gap-1.5 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="mr-3 font-mono font-bold text-foreground">
                    {ov.override_date}
                  </span>
                  <span
                    className={`font-semibold tracking-wider uppercase ${
                      ov.is_closed ? "text-error" : "text-accent-strong"
                    }`}
                  >
                    {ov.is_closed ? "Closed" : "Custom Hours"}
                  </span>
                  {ov.reason && (
                    <span className="text-foreground-muted block sm:ml-2 sm:inline">
                      — {ov.reason}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDate(ov.override_date)}
                  className="inline-flex min-h-[36px] items-center self-start font-medium text-primary hover:underline sm:self-auto"
                >
                  Edit Override →
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
