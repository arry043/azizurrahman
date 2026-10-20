import { afterEach, describe, expect, it, vi } from "vitest";

import { EnvValidationError } from "@/lib/env/parse";
import { DEFAULT_SITE_URL, getSiteUrl, getSupabasePublicEnv } from "@/lib/env/public";
import {
  getAppointmentLookupSecret,
  getConsultationTimeZone,
  getResendApiKey,
  getServiceRoleKey,
} from "@/lib/env/server";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("public env", () => {
  it("defaults the site URL to localhost when unset or blank", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(getSiteUrl().href).toBe(`${DEFAULT_SITE_URL}/`);
  });

  it("accepts a valid https site URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.org");
    expect(getSiteUrl().origin).toBe("https://example.org");
  });

  it("rejects a malformed site URL instead of silently falling back", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "not a url");
    expect(() => getSiteUrl()).toThrow(EnvValidationError);
  });

  it("requires Supabase URL and key only when a Supabase client is requested", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const error = (() => {
      try {
        getSupabasePublicEnv();
      } catch (caught) {
        return caught;
      }
    })();
    expect(error).toBeInstanceOf(EnvValidationError);
    expect((error as EnvValidationError).variables).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]);
  });

  it("parses valid Supabase settings", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "sb_publishable_example_key_value");
    expect(getSupabasePublicEnv().NEXT_PUBLIC_SUPABASE_URL).toBe("http://127.0.0.1:54321");
  });
});

describe("server env", () => {
  it("never includes secret values in validation errors", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "short-secret");
    expect(() => getServiceRoleKey()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(() => getServiceRoleKey()).not.toThrow(/short-secret/);
  });

  it("validates the consultation timezone as an IANA name", () => {
    vi.stubEnv("CONSULTATION_TIMEZONE", "Asia/Kolkata");
    expect(getConsultationTimeZone()).toBe("Asia/Kolkata");
    vi.stubEnv("CONSULTATION_TIMEZONE", "IST");
    expect(() => getConsultationTimeZone()).toThrow(EnvValidationError);
    vi.stubEnv("CONSULTATION_TIMEZONE", "");
    expect(() => getConsultationTimeZone()).toThrow(/is required/);
  });

  it("requires a long lookup secret", () => {
    vi.stubEnv("APPOINTMENT_LOOKUP_SECRET", "too-short");
    expect(() => getAppointmentLookupSecret()).toThrow(EnvValidationError);
    vi.stubEnv("APPOINTMENT_LOOKUP_SECRET", "x".repeat(48));
    expect(getAppointmentLookupSecret()).toHaveLength(48);
  });

  it("treats the email provider key as optional", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect(getResendApiKey()).toBeNull();
    vi.stubEnv("RESEND_API_KEY", "re_test");
    expect(getResendApiKey()).toBe("re_test");
  });
});
