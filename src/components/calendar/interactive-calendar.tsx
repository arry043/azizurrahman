"use client";

import { useEffect, useId, useState } from "react";

import { Alert } from "@/components/ui/alert";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  SpinnerIcon,
} from "@/components/ui/icons";
import { useTranslations } from "@/i18n/client";
import { cn } from "@/lib/utils";

export interface InteractiveCalendarProps {
  serviceIds: string[];
  totalDurationMinutes: number;
  selectedDate?: string; // YYYY-MM-DD
  selectedTime?: string; // HH:mm
  onSelectSlot: (date: string, time: string) => void;
  className?: string;
}

interface MonthData {
  year: number;
  month: number;
  timezone: string;
  bookingHorizonEndDate: string;
  minAdvanceNoticeMinutes: number;
  days: {
    date: string;
    status: "available" | "fully_booked" | "closed" | "past" | "out_of_horizon";
    availableSlotCount: number;
  }[];
}

interface DayData {
  date: string;
  status: "available" | "fully_booked" | "closed" | "past" | "out_of_horizon";
  availableSlotCount: number;
  slots: { startTime: string; endTime: string }[];
  totalDurationMinutes: number;
  timezone: string;
}

export function InteractiveCalendar({
  serviceIds,
  totalDurationMinutes,
  selectedDate,
  selectedTime,
  onSelectSlot,
  className,
}: InteractiveCalendarProps) {
  const { t, locale } = useTranslations();
  const isUr = locale === "ur";

  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);

  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string>("");

  const activeMonthData = serviceIds.length > 0 ? monthData : null;
  const activeDayData = selectedDate && serviceIds.length > 0 ? dayData : null;

  const loadingMonth =
    serviceIds.length > 0 &&
    (!monthData || monthData.year !== currentYear || monthData.month !== currentMonth);
  const loadingSlots = Boolean(
    selectedDate && serviceIds.length > 0 && (!dayData || dayData.date !== selectedDate),
  );

  const timeZoneDisplay = activeMonthData?.timezone ?? "Asia/Kolkata";
  const calendarId = useId();

  // Fetch month availability whenever year, month, or selected services change
  useEffect(() => {
    if (serviceIds.length === 0) {
      return;
    }

    let isMounted = true;
    const monthStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
    const params = new URLSearchParams({
      month: monthStr,
      services: serviceIds.join(","),
    });

    fetch(`/api/availability?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || t.calendar.errorLoadMonth);
        }
        return res.json();
      })
      .then((json) => {
        if (isMounted) {
          setMonthData(json.data);
          setErrorMessage(null);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : t.calendar.errorLoadMonth;
          setErrorMessage(msg);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentYear, currentMonth, serviceIds, t]);

  // Fetch slots whenever selectedDate or services change
  useEffect(() => {
    if (!selectedDate || serviceIds.length === 0) {
      return;
    }

    let isMounted = true;
    const params = new URLSearchParams({
      date: selectedDate,
      services: serviceIds.join(","),
    });

    fetch(`/api/availability?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || t.calendar.errorLoadSlots);
        }
        return res.json();
      })
      .then((json) => {
        if (isMounted) {
          setDayData(json.data);
          const slotCount = json.data?.slots?.length ?? 0;
          setAnnouncement(`${slotCount} ${t.calendar.statusAvailable} (${selectedDate}).`);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDayData(null);
          setAnnouncement(t.calendar.noSlotsNotice);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, serviceIds, t]);

  function handlePrevMonth() {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    setCurrentYear(prevYear);
    setCurrentMonth(prevMonth);
    setAnnouncement(`${t.calendar.months[prevMonth - 1]} ${prevYear}`);
  }

  function handleNextMonth() {
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    setCurrentYear(nextYear);
    setCurrentMonth(nextMonth);
    setAnnouncement(`${t.calendar.months[nextMonth - 1]} ${nextYear}`);
  }

  // Calculate grid padding for the first day of the month
  const firstDayOfWeek = new Date(Date.UTC(currentYear, currentMonth - 1, 1)).getUTCDay();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Timezone & Guidelines Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-border/80 bg-cream/30 px-4 py-2.5 text-xs text-muted">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <ClockIcon className="size-4 text-primary" />
          <span>{t.calendar.timezoneLabel}</span>
          <span className="font-semibold text-primary" dir="ltr">
            <bdi>{timeZoneDisplay} (IST)</bdi>
          </span>
        </div>
        <div>
          <span>{t.calendar.totalSession} </span>
          <span className="font-semibold text-primary">
            {totalDurationMinutes} {t.common.minutes}
          </span>
        </div>
      </div>

      {errorMessage && (
        <Alert variant="error" title={t.calendar.errorTitle}>
          {errorMessage}
        </Alert>
      )}

      {/* Live accessibility announcement for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Main Calendar Card & Layout */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Month Grid Column */}
        <div className="rounded-card border border-border bg-surface p-5 shadow-card lg:col-span-7">
          {/* Calendar Header Navigation */}
          <div className="mb-4 flex items-center justify-between">
            <h4
              id={calendarId}
              className="flex items-center gap-2 font-display text-xl font-semibold text-primary sm:text-2xl"
            >
              <span>
                {t.calendar.months[currentMonth - 1]} {currentYear}
              </span>
              {loadingMonth && <SpinnerIcon className="size-4 animate-spin text-accent" />}
            </h4>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label={t.calendar.previousMonth}
                className="flex size-11 cursor-pointer items-center justify-center rounded-control border border-border text-foreground hover:bg-surface-muted focus-visible:outline-3 focus-visible:outline-focus sm:size-10"
              >
                <ChevronLeftIcon className="size-4 rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label={t.calendar.nextMonth}
                className="flex size-11 cursor-pointer items-center justify-center rounded-control border border-border text-foreground hover:bg-surface-muted focus-visible:outline-3 focus-visible:outline-focus sm:size-10"
              >
                <ChevronRightIcon className="size-4 rtl:rotate-180" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold tracking-wider text-muted uppercase">
            {t.calendar.weekdays.map((w) => (
              <div key={w} className="py-1.5">
                {w}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            role="grid"
            aria-labelledby={calendarId}
            className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2"
          >
            {/* Blank offset cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} aria-hidden="true" className="min-h-11 sm:h-12" />
            ))}

            {/* Month Day Cells */}
            {activeMonthData?.days.map((day) => {
              const [y, m, d] = day.date.split("-").map(Number);
              const isSelected = selectedDate === day.date;
              const isAvailable = day.status === "available";
              const isClosed = day.status === "closed";
              const isFullyBooked = day.status === "fully_booked";
              const isPast = day.status === "past" || day.status === "out_of_horizon";

              let stateLabel = t.calendar.statusUnavailable;
              if (isAvailable)
                stateLabel = `${day.availableSlotCount} ${t.calendar.statusAvailable}`;
              else if (isClosed) stateLabel = t.calendar.statusClosed;
              else if (isFullyBooked) stateLabel = t.calendar.statusFullyBooked;
              else if (isPast) stateLabel = t.calendar.statusPast;

              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={!isAvailable}
                  aria-disabled={!isAvailable}
                  onClick={() => {
                    if (isAvailable) {
                      setAnnouncement(`${t.calendar.months[m! - 1]} ${d}, ${y}: ${stateLabel}`);
                      onSelectSlot(day.date, "");
                    }
                  }}
                  aria-label={`${t.calendar.months[m! - 1]} ${d}, ${y}: ${stateLabel}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "relative flex min-h-11 min-w-10 cursor-pointer flex-col items-center justify-center rounded-control text-xs font-medium transition-all sm:h-12 sm:min-w-11 sm:text-sm",
                    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus",
                    isSelected
                      ? "border-2 border-primary bg-primary font-semibold text-primary-foreground shadow-subtle"
                      : isAvailable
                        ? "border border-border bg-surface text-foreground hover:border-primary hover:bg-cream/40"
                        : "cursor-not-allowed border border-transparent bg-surface-muted/40 text-muted/40",
                  )}
                >
                  <span dir="ltr">{d}</span>
                  {isAvailable && !isSelected && (
                    <span className="size-1 rounded-full bg-emerald" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 border-t border-border/60 pt-4 text-xs text-muted">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald" />
              <span>{t.calendar.available}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary" />
              <span>{t.calendar.selected}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full border border-border bg-surface-muted" />
              <span>{t.calendar.closedBooked}</span>
            </div>
          </div>
        </div>

        {/* Time Slots Column */}
        <div className="rounded-card border border-border bg-surface p-5 text-start shadow-card lg:col-span-5">
          <div className="border-b border-border/60 pb-3">
            <h4 className="font-display text-lg font-semibold text-primary">
              {selectedDate ? (
                <>
                  {t.calendar.availableTimesFor}{" "}
                  <span className="text-foreground" dir="ltr">
                    <bdi>
                      {new Date(selectedDate + "T00:00:00Z").toLocaleDateString(
                        isUr ? "ur-PK" : "en-US",
                        {
                          timeZone: "UTC",
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </bdi>
                  </span>
                </>
              ) : (
                t.calendar.selectADate
              )}
            </h4>
            <p className="mt-1 text-xs text-muted">
              {selectedDate ? t.calendar.selectStartTime : t.calendar.chooseDateNotice}
            </p>
          </div>

          <div className="mt-4">
            {loadingSlots ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted">
                <SpinnerIcon className="size-6 animate-spin text-primary" />
                <span className="mt-2 text-xs">{t.calendar.loadingSlots}</span>
              </div>
            ) : !selectedDate ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted">
                <CalendarIcon className="size-8 text-border" />
                <p className="mt-3 text-xs leading-relaxed">{t.calendar.chooseDateNotice}</p>
              </div>
            ) : activeDayData?.slots && activeDayData.slots.length > 0 ? (
              <div className="max-h-[340px] space-y-2 overflow-y-auto pe-1">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                  {activeDayData.slots.map((slot) => {
                    const isTimeSelected = selectedTime === slot.startTime;

                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        onClick={() => onSelectSlot(selectedDate, slot.startTime)}
                        aria-pressed={isTimeSelected}
                        className={cn(
                          "flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-control border p-2 text-xs font-medium transition-all sm:text-sm",
                          "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus",
                          isTimeSelected
                            ? "border-primary bg-primary font-semibold text-primary-foreground shadow-subtle"
                            : "border-border bg-surface text-foreground hover:border-primary hover:bg-cream/40",
                        )}
                      >
                        <span className="font-semibold" dir="ltr">
                          <bdi>{slot.startTime}</bdi>
                        </span>
                        <span className="text-[10px] opacity-80">
                          {t.calendar.until} <bdi dir="ltr">{slot.endTime}</bdi>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted">
                <ClockIcon className="size-8 text-border" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  {t.calendar.noSlotsAvailable}
                </p>
                <p className="mt-1 text-xs text-muted">{t.calendar.noSlotsNotice}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
