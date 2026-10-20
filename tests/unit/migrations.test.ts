import { describe, expect, it } from "vitest";

import { listFiles, read } from "../support/files";

const migrationFiles = listFiles("supabase/migrations", /\.sql$/);
const allSql = migrationFiles.map(read).join("\n");
const publicTables = [...allSql.matchAll(/create table public\.([a-z_]+)/g)].map((m) => m[1] ?? "");

/** Static checks that complement the live pgTAP suites in supabase/tests/database. */
describe("migrations (static)", () => {
  it("use unique, ordered 14-digit timestamps", () => {
    const versions = migrationFiles.map((file) => file.split("/").pop()?.slice(0, 14) ?? "");
    for (const version of versions) {
      expect(version).toMatch(/^\d{14}$/);
    }
    expect(new Set(versions).size).toBe(versions.length);
    expect([...versions].sort()).toEqual(versions);
  });

  it("enable RLS on every public table", () => {
    expect(publicTables.length).toBeGreaterThan(0);
    for (const table of publicTables) {
      expect(allSql, table).toMatch(
        new RegExp(`alter table public\\.${table} enable row level security`),
      );
    }
  });

  it("revoke Supabase's default anon/authenticated grants on every public table", () => {
    const revokeStatements = [
      ...allSql.matchAll(/revoke all on table([\s\S]*?)from anon, authenticated;/g),
    ]
      .map((m) => m[1] ?? "")
      .join(" ");
    for (const table of publicTables) {
      expect(revokeStatements, table).toContain(`public.${table}`);
    }
  });

  it("never grant anon access to private appointment or admin data", () => {
    for (const table of [
      "appointments",
      "appointment_services",
      "appointment_events",
      "admin_profiles",
      "date_overrides",
      "date_override_intervals",
      "notification_logs",
    ]) {
      expect(allSql).not.toMatch(new RegExp(`grant [a-z, ]+ on table public\\.${table} to anon`));
    }
  });

  it("pin search_path on every function", () => {
    const functions = allSql.split(/create or replace function /).slice(1);
    expect(functions.length).toBeGreaterThan(0);
    for (const fn of functions) {
      const header = fn.split("$$")[0] ?? "";
      expect(header, header.split("(")[0]).toMatch(/set search_path = ''/);
    }
  });

  it("do not hard-code a closed weekday", () => {
    expect(allSql).not.toMatch(/weekday\s*(=|<>|!=)\s*0/);
  });
});
