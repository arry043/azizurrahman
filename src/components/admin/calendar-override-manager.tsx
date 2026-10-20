"use client";

import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  checkDateOverrideConflictsAction,
  deleteDateOverrideAction,
  saveDateOverrideAction,
} from "@/lib/admin/availability-actions";
import type {
  AdminDateOverrideWithIntervals,
  ScheduleConflictWarning,
} from "@/lib/admin/availability-admin-service";
import type { AppointmentRow } from "@/types/domain";

interface OverrideManagerProps {
  dateStr: string;
  existingOverride?: AdminDateOverrideWithIntervals | null;
  dayAppointments: AppointmentRow[];
  onClose: () => void;
}

export function CalendarOverrideManager({
  dateStr,
  existingOverride,
  dayAppointments,
  onClose,
}: OverrideManagerProps) {
  const [isClosed, setIsClosed] = useState(existingOverride ? existingOverride.is_closed : true);
  const [reason, setReason] = useState(existingOverride?.reason || "");
  const [intervals, setIntervals] = useState<{ start_time: string; end_time: string }[]>(
    existingOverride?.intervals.map((i) => ({
      start_time: i.start_time.slice(0, 5),
      end_time: i.end_time.slice(0, 5),
    })) || [{ start_time: "10:00", end_time: "14:00" }],
  );

  const [conflicts, setConflicts] = useState<ScheduleConflictWarning[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAddInterval() {
    setIntervals((prev) => [...prev, { start_time: "15:00", end_time: "18:00" }]);
  }

  function handleRemoveInterval(index: number) {
    setIntervals((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  }

  function handleIntervalChange(index: number, field: "start_time" | "end_time", value: string) {
    setIntervals((prev) => {
      const next = [...prev];
      const current = next[index] ?? { start_time: "10:00", end_time: "14:00" };
      next[index] = {
        start_time: field === "start_time" ? value : current.start_time,
        end_time: field === "end_time" ? value : current.end_time,
      };
      return next;
    });
  }

  function handleSave(forceProceed = false) {
    setError(null);

    startTransition(async () => {
      if (!forceProceed) {
        // Pre-flight conflict check
        const conflictRes = await checkDateOverrideConflictsAction({
          overrideDate: dateStr,
          isClosed,
          intervals,
        });

        if (conflictRes.success && conflictRes.data && conflictRes.data.length > 0) {
          setConflicts(conflictRes.data);
          return;
        }
      }

      const res = await saveDateOverrideAction({
        overrideDate: dateStr,
        isClosed,
        reason: reason.trim() || null,
        intervals,
      });

      if (!res.success) {
        setError(res.error || "Failed to save date override.");
      } else {
        onClose();
      }
    });
  }

  function handleDelete() {
    if (!existingOverride) return;
    setError(null);

    startTransition(async () => {
      const res = await deleteDateOverrideAction(existingOverride.id);
      if (!res.success) {
        setError(res.error || "Failed to remove date override.");
      } else {
        onClose();
      }
    });
  }

  return (
    <Card className="space-y-4 border-border bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Date Override for {dateStr}</h2>
          <p className="text-foreground-muted text-xs">
            Configure exceptional closures or custom one-off operating hours.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-foreground-muted flex min-h-[44px] min-w-[44px] items-center justify-center text-xs hover:text-foreground"
          aria-label="Close override editor"
        >
          ✕
        </button>
      </div>

      {error && (
        <Alert variant="error" title="Override Error">
          {error}
        </Alert>
      )}

      {/* Existing Appointments Notice */}
      {dayAppointments.length > 0 && (
        <div className="rounded-md border border-border bg-surface-muted/40 p-3 text-xs">
          <p className="font-semibold text-foreground">
            Current Bookings on this Date: {dayAppointments.length}
          </p>
          <ul className="text-foreground-muted mt-1 space-y-0.5">
            {dayAppointments.map((app) => (
              <li key={app.id}>
                • <strong className="font-mono text-foreground">{app.public_reference}</strong>:{" "}
                {app.customer_name} ({app.status})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conflicts warning */}
      {conflicts && (
        <div className="space-y-2 rounded-md border border-warning bg-warning/10 p-3">
          <p className="text-xs font-semibold text-warning">
            ⚠ Override Conflicts with Existing Bookings
          </p>
          <p className="text-xs text-foreground">
            Closing or modifying hours on this date affects {conflicts.length} confirmed/pending
            appointment(s):
          </p>
          <ul className="list-disc pl-4 text-xs text-foreground">
            {conflicts.map((c) => (
              <li key={c.appointmentId}>
                {c.publicReference}: {c.customerName} (
                {c.conflictType === "closure" ? "Date closed" : "Outside hours"})
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center">
            <Button
              size="sm"
              variant="destructive"
              loading={isPending}
              onClick={() => handleSave(true)}
              className="min-h-[44px] w-full sm:w-auto"
            >
              Confirm Despite Conflicts
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConflicts(null)}
              className="min-h-[44px] w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={isClosed}
              onChange={(e) => setIsClosed(e.target.checked)}
              className="size-5 rounded border-border text-primary focus:ring-primary"
            />
            <span>Completely closed for consultations on this date</span>
          </label>
        </div>

        <div>
          <Input
            label="Internal Reason (Optional)"
            placeholder="e.g. Islamic Holiday, Maintenance, Travel"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            hint="Private note visible only to administrators."
          />
        </div>

        {!isClosed && (
          <div className="space-y-3 border-t border-border/40 pt-2">
            <span className="block text-xs font-semibold text-accent-strong uppercase">
              Custom Opening Hours
            </span>

            {intervals.map((int, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-2.5 rounded-md bg-surface-muted/40 p-3 text-sm sm:flex-row sm:items-center"
              >
                <span className="text-foreground-muted w-20 text-xs font-semibold">
                  Window {idx + 1}:
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="time"
                    value={int.start_time}
                    onChange={(e) => handleIntervalChange(idx, "start_time", e.target.value)}
                    className="min-h-[44px] flex-1 rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground focus:outline-primary sm:min-h-[36px] sm:flex-none"
                  />
                  <span className="text-foreground-muted text-xs">to</span>
                  <input
                    type="time"
                    value={int.end_time}
                    onChange={(e) => handleIntervalChange(idx, "end_time", e.target.value)}
                    className="min-h-[44px] flex-1 rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground focus:outline-primary sm:min-h-[36px] sm:flex-none"
                  />
                </div>
                {intervals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveInterval(idx)}
                    className="ml-auto p-1 text-xs font-medium text-error hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddInterval}
              className="inline-flex min-h-[44px] items-center text-xs font-semibold text-primary hover:underline"
            >
              + Add Another Custom Window
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          {existingOverride && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              loading={isPending}
              onClick={handleDelete}
              className="order-2 min-h-[44px] w-full sm:order-1 sm:w-auto"
            >
              Delete Override
            </Button>
          )}

          <div className="order-1 flex w-full flex-col gap-2 sm:order-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
              className="min-h-[44px] w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={isPending}
              onClick={() => handleSave(false)}
              className="min-h-[44px] w-full sm:w-auto"
            >
              Save Override
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
