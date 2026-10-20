"use client";

import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  checkWeekdayConflictsAction,
  updateWeekdayScheduleAction,
} from "@/lib/admin/availability-actions";
import type {
  ScheduleConflictWarning,
  WeeklyScheduleDay,
} from "@/lib/admin/availability-admin-service";
import type { Weekday } from "@/types/domain";

interface ScheduleEditorProps {
  initialSchedule: WeeklyScheduleDay[];
}

export function WeeklyScheduleEditor({ initialSchedule }: ScheduleEditorProps) {
  const [schedule, setSchedule] = useState<WeeklyScheduleDay[]>(initialSchedule);
  const [savingWeekday, setSavingWeekday] = useState<Weekday | null>(null);
  const [activeConflicts, setActiveConflicts] = useState<{
    weekday: Weekday;
    conflicts: ScheduleConflictWarning[];
  } | null>(null);
  const [feedback, setFeedback] = useState<{
    weekday: Weekday;
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggleClosed(weekday: Weekday, isClosed: boolean) {
    setSchedule((prev) =>
      prev.map((d) => {
        if (d.weekday !== weekday) return d;
        return {
          ...d,
          is_closed: isClosed,
          // if opening and has no intervals, supply a sensible default
          intervals:
            !isClosed && d.intervals.length === 0
              ? [{ start_time: "10:00", end_time: "18:00" }]
              : d.intervals,
        };
      }),
    );
  }

  function handleAddInterval(weekday: Weekday) {
    setSchedule((prev) =>
      prev.map((d) => {
        if (d.weekday !== weekday) return d;
        return {
          ...d,
          intervals: [...d.intervals, { start_time: "15:00", end_time: "19:00" }],
        };
      }),
    );
  }

  function handleRemoveInterval(weekday: Weekday, index: number) {
    setSchedule((prev) =>
      prev.map((d) => {
        if (d.weekday !== weekday) return d;
        const next = [...d.intervals];
        next.splice(index, 1);
        return {
          ...d,
          intervals: next,
        };
      }),
    );
  }

  function handleIntervalChange(
    weekday: Weekday,
    index: number,
    field: "start_time" | "end_time",
    val: string,
  ) {
    setSchedule((prev) =>
      prev.map((d) => {
        if (d.weekday !== weekday) return d;
        const next = [...d.intervals];
        const current = next[index] ?? { start_time: "10:00", end_time: "18:00" };
        next[index] = {
          ...current,
          start_time: field === "start_time" ? val : current.start_time,
          end_time: field === "end_time" ? val : current.end_time,
        };
        return {
          ...d,
          intervals: next,
        };
      }),
    );
  }

  async function handleCheckAndSave(day: WeeklyScheduleDay, forceProceed = false) {
    setFeedback(null);
    setSavingWeekday(day.weekday);

    startTransition(async () => {
      if (!forceProceed) {
        // Pre-flight conflict check
        const conflictRes = await checkWeekdayConflictsAction({
          weekday: day.weekday,
          isClosed: day.is_closed,
          intervals: day.intervals,
        });

        if (conflictRes.success && conflictRes.data && conflictRes.data.length > 0) {
          setActiveConflicts({ weekday: day.weekday, conflicts: conflictRes.data });
          setSavingWeekday(null);
          return;
        }
      }

      // Execute save
      const res = await updateWeekdayScheduleAction({
        weekday: day.weekday,
        isClosed: day.is_closed,
        intervals: day.intervals,
      });

      setSavingWeekday(null);
      setActiveConflicts(null);

      if (!res.success) {
        setFeedback({
          weekday: day.weekday,
          type: "error",
          message: res.error || "Failed to update schedule.",
        });
      } else {
        setFeedback({
          weekday: day.weekday,
          type: "success",
          message: `Saved schedule for ${day.weekdayName}.`,
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {schedule.map((day) => {
        const isSaving = savingWeekday === day.weekday && isPending;
        const dayFeedback = feedback?.weekday === day.weekday ? feedback : null;
        const hasConflictModal = activeConflicts?.weekday === day.weekday;

        return (
          <Card
            key={day.weekday}
            className={`border-border bg-surface p-4 shadow-card transition-colors sm:p-5 ${
              day.is_closed ? "bg-surface-muted/30" : ""
            }`}
          >
            <div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <h3 className="font-serif text-lg font-bold text-foreground">{day.weekdayName}</h3>
                {day.is_closed ? (
                  <Badge variant="neutral">Closed</Badge>
                ) : (
                  <Badge variant="success">
                    Open ({day.intervals.length} window{day.intervals.length === 1 ? "" : "s"})
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={!day.is_closed}
                    onChange={(e) => handleToggleClosed(day.weekday, !e.target.checked)}
                    className="size-5 rounded border-border text-primary focus:ring-primary"
                  />
                  <span>Open for consultations</span>
                </label>
              </div>
            </div>

            {dayFeedback && (
              <div className="mt-3">
                <Alert variant={dayFeedback.type === "success" ? "info" : "error"}>
                  {dayFeedback.message}
                </Alert>
              </div>
            )}

            {/* Conflict Warning Box */}
            {hasConflictModal && (
              <div className="mt-4 space-y-3 rounded-lg border border-warning bg-warning/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-warning">
                  <span>⚠</span>
                  <span>Schedule Conflict Detected</span>
                </div>
                <p className="text-xs text-foreground">
                  Your proposed schedule modification affects{" "}
                  <strong>{activeConflicts.conflicts.length}</strong> upcoming active
                  consultation(s) booked on {day.weekdayName}s:
                </p>
                <ul className="list-disc space-y-1 pl-4 text-xs text-foreground">
                  {activeConflicts.conflicts.slice(0, 5).map((c) => (
                    <li key={c.appointmentId}>
                      <span className="font-mono font-medium">{c.publicReference}</span>:{" "}
                      {c.customerName} (
                      {c.conflictType === "closure" ? "Day closed" : "Time outside new hours"})
                    </li>
                  ))}
                  {activeConflicts.conflicts.length > 5 && (
                    <li>...and {activeConflicts.conflicts.length - 5} more appointments</li>
                  )}
                </ul>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                  <Button
                    size="sm"
                    variant="destructive"
                    loading={isSaving}
                    onClick={() => handleCheckAndSave(day, true)}
                    className="min-h-[44px] w-full sm:w-auto"
                  >
                    Confirm & Apply Despite Conflicts
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveConflicts(null)}
                    className="min-h-[44px] w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {!day.is_closed ? (
              <div className="mt-4 space-y-3">
                <div className="space-y-2.5">
                  {day.intervals.map((int, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-2.5 rounded-md bg-surface-muted/40 p-3 text-sm sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center justify-between gap-2 sm:justify-start">
                        <span className="text-foreground-muted w-16 text-xs font-semibold">
                          Shift {idx + 1}:
                        </span>
                        {day.intervals.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveInterval(day.weekday, idx)}
                            className="p-1 text-xs font-medium text-error hover:underline sm:hidden"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="flex flex-1 items-center gap-2">
                        <label htmlFor={`start-${day.weekday}-${idx}`} className="sr-only">
                          Start Time
                        </label>
                        <input
                          id={`start-${day.weekday}-${idx}`}
                          type="time"
                          value={int.start_time}
                          onChange={(e) =>
                            handleIntervalChange(day.weekday, idx, "start_time", e.target.value)
                          }
                          className="min-h-[44px] flex-1 rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground focus:outline-primary sm:min-h-[36px] sm:flex-none"
                        />
                        <span className="text-foreground-muted text-xs">to</span>
                        <label htmlFor={`end-${day.weekday}-${idx}`} className="sr-only">
                          End Time
                        </label>
                        <input
                          id={`end-${day.weekday}-${idx}`}
                          type="time"
                          value={int.end_time}
                          onChange={(e) =>
                            handleIntervalChange(day.weekday, idx, "end_time", e.target.value)
                          }
                          className="min-h-[44px] flex-1 rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground focus:outline-primary sm:min-h-[36px] sm:flex-none"
                        />
                      </div>

                      {day.intervals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveInterval(day.weekday, idx)}
                          className="ml-auto hidden text-xs text-error hover:underline sm:inline-flex"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => handleAddInterval(day.weekday)}
                    className="inline-flex min-h-[44px] items-center text-xs font-semibold text-primary hover:underline"
                  >
                    + Add Split Interval (e.g. Afternoon Shift)
                  </button>

                  <Button
                    size="sm"
                    variant="primary"
                    loading={isSaving}
                    disabled={isPending}
                    onClick={() => handleCheckAndSave(day)}
                    className="min-h-[44px] w-full sm:w-auto"
                  >
                    Save {day.weekdayName}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-foreground-muted mt-4 flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                <p>No consultations can be booked on {day.weekdayName}s.</p>
                <Button
                  size="sm"
                  variant="primary"
                  loading={isSaving}
                  disabled={isPending}
                  onClick={() => handleCheckAndSave(day)}
                  className="min-h-[44px] w-full sm:w-auto"
                >
                  Save Closed Status
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
