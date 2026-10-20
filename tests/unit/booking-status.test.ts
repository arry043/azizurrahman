import { describe, expect, it } from "vitest";

import {
  ALLOWED_STATUS_TRANSITIONS,
  APPOINTMENT_STATUSES,
  canTransition,
  reservesCapacity,
} from "@/lib/booking/status";

import { read } from "../support/files";

const migration = read("supabase/migrations/20261020100200_appointments.sql");

/** Extract the transition pairs from private.appointment_status_transition_allowed(). */
function sqlTransitions(): string[] {
  const body = migration.split(
    "create or replace function private.appointment_status_transition_allowed",
  )[1];
  const block = body?.split("$$;")[0] ?? "";
  return [...block.matchAll(/\('([a-z_]+)', '([a-z_]+)'\)/g)].map((m) => `${m[1]}->${m[2]}`).sort();
}

describe("appointment status policy", () => {
  it("matches the database enum", () => {
    const enumBlock =
      migration.match(/create type public\.appointment_status as enum \(([^)]+)\)/)?.[1] ?? "";
    const sqlValues = [...enumBlock.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(sqlValues).toEqual([...APPOINTMENT_STATUSES]);
  });

  it("matches the database transition table", () => {
    const tsTransitions = Object.entries(ALLOWED_STATUS_TRANSITIONS)
      .flatMap(([from, targets]) => targets.map((to) => `${from}->${to}`))
      .sort();
    expect(tsTransitions).toEqual(sqlTransitions());
  });

  it("matches the database capacity rule", () => {
    const generated =
      migration.match(
        /reserves_capacity boolean generated always as \(\s*status in \(([^)]+)\)/,
      )?.[1] ?? "";
    const sqlReserving = [...generated.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
    expect(APPOINTMENT_STATUSES.filter(reservesCapacity).sort()).toEqual(sqlReserving);
  });

  it("treats declined and cancelled as terminal", () => {
    for (const to of APPOINTMENT_STATUSES) {
      expect(canTransition("declined", to)).toBe(to === "declined");
      expect(canTransition("cancelled", to)).toBe(to === "cancelled");
    }
  });

  it("never lets a confirmed appointment fall back to pending", () => {
    expect(canTransition("confirmed", "pending")).toBe(false);
  });
});
