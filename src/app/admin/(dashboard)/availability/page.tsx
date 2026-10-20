import type { Metadata } from "next";

import { WeeklyScheduleEditor } from "@/components/admin/weekly-schedule-editor";
import { getAdminWeeklySchedule } from "@/lib/admin/availability-admin-service";
import { requireAdminAuth } from "@/lib/auth/admin-auth";
import { getConsultationTimeZone } from "@/lib/env/server";

export const metadata: Metadata = {
  title: "Weekly Availability Schedule",
  description:
    "Configure standard operating hours and split shift intervals for each day of the week.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminAvailabilityPage() {
  const { supabase } = await requireAdminAuth();
  const timeZone = getConsultationTimeZone();
  const schedule = await getAdminWeeklySchedule(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Weekly Availability Schedule
        </h1>
        <p className="text-foreground-muted mt-1 text-sm">
          Define recurring consultation hours and split shifts across the week in the{" "}
          <strong className="font-mono text-forest">{timeZone}</strong> timezone.
        </p>
      </div>

      <div className="text-foreground-muted space-y-1 rounded-lg border border-border bg-surface-muted/40 p-4 text-xs">
        <p className="font-semibold text-foreground">Operational Rule</p>
        <p>
          Configuring operating hours establishes the consultation windows. Individual bookable
          slots are computed automatically from these windows based on service durations, buffers,
          and slot intervals. Sunday is fully configurable.
        </p>
      </div>

      <WeeklyScheduleEditor initialSchedule={schedule} />
    </div>
  );
}
