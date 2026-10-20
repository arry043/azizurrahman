/**
 * Exercises RLS through the real Data API (PostgREST), exactly as a browser holding the public
 * anon key would. Requires a running local Supabase with the development seed:
 *
 *   npm run db:start && npm run db:reset
 *   NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… npm run test:integration
 *
 * Skipped automatically when the variables are not set (e.g. in CI without Docker).
 */
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import type { Database } from "@/types/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configured = Boolean(url && anonKey && serviceRoleKey);

const options = { auth: { persistSession: false, autoRefreshToken: false } } as const;

describe.skipIf(!configured)("Data API as an anonymous visitor", () => {
  const anon = configured ? createClient<Database>(url!, anonKey!, options) : null!;

  it("lists only active services", async () => {
    const { data, error } = await anon.from("services").select("slug, is_active");
    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThan(0);
    expect(data?.every((service) => service.is_active)).toBe(true);
    expect(data?.map((service) => service.slug)).not.toContain("dev-sample-archived-service");
  });

  it("getActiveServices returns only active services in display order", async () => {
    const { getActiveServices, getActiveServiceBySlug, getPublicSiteSettings } =
      await import("@/lib/services/public-services");
    const services = await getActiveServices();
    expect(services.length).toBeGreaterThanOrEqual(2);
    expect(services.every((s) => s.slug !== "dev-sample-archived-service")).toBe(true);

    const activeService = await getActiveServiceBySlug("dev-sample-short-consultation");
    expect(activeService).not.toBeNull();
    expect(activeService?.slug).toBe("dev-sample-short-consultation");

    const archivedService = await getActiveServiceBySlug("dev-sample-archived-service");
    expect(archivedService).toBeNull();

    const settings = await getPublicSiteSettings();
    expect(settings).not.toBeNull();
    expect(settings?.booking_horizon_days).toBeGreaterThan(0);
  });

  it("can read the weekly schedule and public settings", async () => {
    const weekly = await anon.from("weekly_availability").select("weekday");
    const settings = await anon.from("site_settings").select("booking_horizon_days");
    expect(weekly.data).toHaveLength(7);
    expect(settings.data).toHaveLength(1);
  });

  it.each([
    "appointments",
    "appointment_services",
    "appointment_events",
    "admin_profiles",
    "date_overrides",
    "date_override_intervals",
  ] as const)("is denied read access to %s", async (table) => {
    const { data, error } = await anon.from(table).select("*").limit(1);
    expect(data).toBeNull();
    expect(error?.code).toBe("42501");
  });

  it("cannot create an appointment directly", async () => {
    const { error } = await anon.from("appointments").insert({
      customer_name: "Direct insert",
      phone_number: "+15555550999",
      normalized_phone: "+15555550999",
      appointment_start: "2033-01-01T05:00:00Z",
      appointment_end: "2033-01-01T05:30:00Z",
      blocked_start: "2033-01-01T05:00:00Z",
      blocked_end: "2033-01-01T05:30:00Z",
      timezone: "Asia/Kolkata",
    });
    expect(error?.code).toBe("42501");
  });

  it("cannot change settings or the schedule", async () => {
    const settings = await anon
      .from("site_settings")
      .update({ booking_horizon_days: 1 })
      .eq("id", true);
    const weekly = await anon
      .from("weekly_availability")
      .update({ is_closed: false })
      .eq("weekday", 0);
    expect(settings.error?.code).toBe("42501");
    expect(weekly.error?.code).toBe("42501");
  });

  it("cannot reach private helper functions", async () => {
    const { error } = await anon.schema("private" as "public").rpc("is_admin" as never);
    expect(error).not.toBeNull();
  });

  it("cannot sign up (public registration disabled)", async () => {
    const { data, error } = await anon.auth.signUp({
      email: `signup-probe-${Date.now()}@example.com`,
      password: "Probe-Password-123",
    });
    expect(data.user).toBeNull();
    expect(error).not.toBeNull();
  });
});

describe.skipIf(!configured)("Data API as the trusted server (service role)", () => {
  const server = configured ? createClient<Database>(url!, serviceRoleKey!, options) : null!;

  it("can read appointments for server-side operations", async () => {
    const { data, error } = await server
      .from("appointments")
      .select("public_reference, status")
      .limit(5);
    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThan(0);
  });
});
