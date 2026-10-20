import type { AppointmentStatus } from "@/types/domain";

/**
 * Application mirror of the PROPOSED booking policy enforced in the database
 * (supabase/migrations/20261020100200_appointments.sql). The database is authoritative; these
 * helpers let the UI offer only valid actions. Keep both in sync — tests compare them.
 */

export const APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
  "reschedule_requested",
  "declined",
  "cancelled",
] as const satisfies readonly AppointmentStatus[];

/** BR-14 (proposed): statuses that hold a slot and count toward the daily limit. */
export const CAPACITY_RESERVING_STATUSES: ReadonlySet<AppointmentStatus> = new Set([
  "pending",
  "confirmed",
  "reschedule_requested",
]);

/** BR-16 (proposed): allowed transitions. Terminal statuses map to an empty list. */
export const ALLOWED_STATUS_TRANSITIONS: Readonly<
  Record<AppointmentStatus, readonly AppointmentStatus[]>
> = {
  pending: ["confirmed", "reschedule_requested", "declined", "cancelled"],
  confirmed: ["reschedule_requested", "cancelled"],
  reschedule_requested: ["confirmed", "declined", "cancelled"],
  declined: [],
  cancelled: [],
};

export function reservesCapacity(status: AppointmentStatus): boolean {
  return CAPACITY_RESERVING_STATUSES.has(status);
}

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return from === to || ALLOWED_STATUS_TRANSITIONS[from].includes(to);
}
