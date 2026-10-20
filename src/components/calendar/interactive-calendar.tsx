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

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function InteractiveCalendar({
  serviceIds,
  totalDurationMinutes,
  selectedDate,
  selectedTime,
  onSelectSlot,
  className,
}: InteractiveCalendarProps) {
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);

  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          throw new Error(errJson.error || "Failed to load availability for this month");
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
          const msg =
            err instanceof Error ? err.message : "Failed to load availability for this month";
          setErrorMessage(msg);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentYear, currentMonth, serviceIds]);

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
          throw new Error(errJson.error || "Failed to load available slots for selected date");
        }
        return res.json();
      })
      .then((json) => {
        if (isMounted) {
          setDayData(json.data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDayData(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, serviceIds]);

  function handlePrevMonth() {
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  // Calculate grid padding for the first day of the month
  const firstDayOfWeek = new Date(Date.UTC(currentYear, currentMonth - 1, 1)).getUTCDay();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Timezone & Guidelines Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-border/80 bg-cream/30 px-4 py-2.5 text-xs text-muted">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <ClockIcon className="size-4 text-primary" />
          <span>Consultation Timezone:</span>
          <span className="font-semibold text-primary">{timeZoneDisplay} (IST)</span>
        </div>
        <div>
          <span>Total Session: </span>
          <span className="font-semibold text-primary">{totalDurationMinutes} mins</span>
        </div>
      </div>

      {errorMessage && (
        <Alert variant="error" title="Availability Error">
          {errorMessage}
        </Alert>
      )}

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
                {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </span>
              {loadingMonth && <SpinnerIcon className="size-4 animate-spin text-accent" />}
            </h4>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="flex size-9 items-center justify-center rounded-control border border-border text-foreground hover:bg-surface-muted focus-visible:outline-3 focus-visible:outline-focus"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="flex size-9 items-center justify-center rounded-control border border-border text-foreground hover:bg-surface-muted focus-visible:outline-3 focus-visible:outline-focus"
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold tracking-wider text-muted uppercase">
            {WEEKDAY_NAMES.map((w) => (
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
              <div key={`blank-${i}`} aria-hidden="true" className="h-10 sm:h-12" />
            ))}

            {/* Month Day Cells */}
            {activeMonthData?.days.map((day) => {
              const [y, m, d] = day.date.split("-").map(Number);
              const isSelected = selectedDate === day.date;
              const isAvailable = day.status === "available";
              const isClosed = day.status === "closed";
              const isFullyBooked = day.status === "fully_booked";
              const isPast = day.status === "past" || day.status === "out_of_horizon";

              let stateLabel = "Unavailable";
              if (isAvailable) stateLabel = `${day.availableSlotCount} slots available`;
              else if (isClosed) stateLabel = "Closed";
              else if (isFullyBooked) stateLabel = "Fully booked";
              else if (isPast) stateLabel = "Past date";

              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => {
                    if (isAvailable) {
                      onSelectSlot(day.date, "");
                    }
                  }}
                  aria-label={`${MONTH_NAMES[m! - 1]} ${d}, ${y}: ${stateLabel}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "relative flex h-10 flex-col items-center justify-center rounded-control text-xs font-medium transition-all sm:h-12 sm:text-sm",
                    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus",
                    isSelected
                      ? "border-2 border-primary bg-primary font-semibold text-primary-foreground shadow-subtle"
                      : isAvailable
                        ? "border border-border bg-surface text-foreground hover:border-primary hover:bg-cream/40"
                        : "cursor-not-allowed border border-transparent bg-surface-muted/40 text-muted/40",
                  )}
                >
                  <span>{d}</span>
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
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full border border-border bg-surface-muted" />
              <span>Closed / Booked</span>
            </div>
          </div>
        </div>

        {/* Time Slots Column */}
        <div className="rounded-card border border-border bg-surface p-5 shadow-card lg:col-span-5">
          <div className="border-b border-border/60 pb-3">
            <h4 className="font-display text-lg font-semibold text-primary">
              {selectedDate ? (
                <>
                  Available Times for{" "}
                  <span className="text-foreground">
                    {new Date(selectedDate + "T00:00:00Z").toLocaleDateString("en-US", {
                      timeZone: "UTC",
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </>
              ) : (
                "Select a Date"
              )}
            </h4>
            <p className="mt-1 text-xs text-muted">
              {selectedDate
                ? "Select your preferred consultation start time."
                : "Choose an available date on the calendar to view consultation hours."}
            </p>
          </div>

          <div className="mt-4">
            {loadingSlots ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted">
                <SpinnerIcon className="size-6 animate-spin text-primary" />
                <span className="mt-2 text-xs">Loading available slots...</span>
              </div>
            ) : !selectedDate ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted">
                <CalendarIcon className="size-8 text-border" />
                <p className="mt-3 text-xs leading-relaxed">
                  Please select an available date from the calendar on the left to see times.
                </p>
              </div>
            ) : activeDayData?.slots && activeDayData.slots.length > 0 ? (
              <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
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
                          "flex min-h-11 flex-col items-center justify-center rounded-control border p-2 text-xs font-medium transition-all sm:text-sm",
                          "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus",
                          isTimeSelected
                            ? "border-primary bg-primary font-semibold text-primary-foreground shadow-subtle"
                            : "border-border bg-surface text-foreground hover:border-primary hover:bg-cream/40",
                        )}
                      >
                        <span className="font-semibold">{slot.startTime}</span>
                        <span className="text-[10px] opacity-80">until {slot.endTime}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted">
                <ClockIcon className="size-8 text-border" />
                <p className="mt-2 text-sm font-medium text-foreground">No Slots Available</p>
                <p className="mt-1 text-xs text-muted">
                  All consultation slots for this date are fully reserved or elapsed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
