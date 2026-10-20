import type { Metadata } from "next";

import { AdminCalendarView } from "@/components/admin/admin-calendar-view";
import {
  getAdminDateOverrides,
  getAdminWeeklySchedule,
} from "@/lib/admin/availability-admin-service";
import { requireAdminAuth } from "@/lib/auth/admin-auth";
import { utcToLocal } from "@/lib/availability/date-utils";
import { getConsultationTimeZone } from "@/lib/env/server";
import type { AppointmentRow } from "@/types/domain";

export const metadata: Metadata = {
  title: "Admin Calendar & Overrides",
  description: "Monthly view of consultations, date overrides, and holiday closures.",
  robots: { index: false, follow: false },
};

export const instant = false;

interface CalendarPageProps {
  searchParams?: Promise<{ month?: string }>;
}

export default async function AdminCalendarPage({ searchParams }: CalendarPageProps) {
  const { supabase } = await requireAdminAuth();
  const timeZone = getConsultationTimeZone();

  const resolved = searchParams ? await searchParams : {};
  const todayLocal = utcToLocal(new Date(), timeZone);

  let currentMonthStr = resolved?.month;
  if (!currentMonthStr || !/^\d{4}-\d{2}$/.test(currentMonthStr)) {
    currentMonthStr = `${todayLocal.year}-${String(todayLocal.month).padStart(2, "0")}`;
  }

  const [yearStr, monthPart] = currentMonthStr.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthPart) - 1; // 0-indexed for Date.UTC

  const firstDay = new Date(Date.UTC(year, monthIndex, 1));
  const startWeekday = firstDay.getUTCDay(); // 0 = Sunday
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const monthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(firstDay);

  const startOfMonth = `${currentMonthStr}-01`;
  const endOfMonth = `${currentMonthStr}-${String(daysInMonth).padStart(2, "0")}`;

  const [overrides, appsRes, weeklySchedule] = await Promise.all([
    getAdminDateOverrides(supabase, { month: currentMonthStr }),
    supabase
      .from("appointments")
      .select("*")
      .gte("local_date", startOfMonth)
      .lte("local_date", endOfMonth)
      .order("appointment_start", { ascending: true }),
    getAdminWeeklySchedule(supabase),
  ]);

  const appointments = (appsRes.data as AppointmentRow[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Calendar & Date Overrides
        </h1>
        <p className="text-foreground-muted mt-1 text-sm">
          Manage one-off closures, public holidays, custom working hours, and review appointment
          density.
        </p>
      </div>

      <AdminCalendarView
        monthName={monthName}
        year={year}
        monthIndex={monthIndex}
        daysInMonth={daysInMonth}
        startWeekday={startWeekday}
        overrides={overrides}
        appointments={appointments}
        weeklySchedule={weeklySchedule}
      />
    </div>
  );
}
