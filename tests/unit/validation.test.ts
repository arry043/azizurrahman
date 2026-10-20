import { describe, expect, it } from "vitest";

import {
  E164_PATTERN,
  SLUG_PATTERN,
  emailSchema,
  normalizeEmail,
  normalizePhone,
} from "@/lib/validation/contact";
import { isValidTimeZone } from "@/lib/validation/timezone";

import { read } from "../support/files";

describe("normalizePhone", () => {
  it.each([
    ["+91 98765 43210", undefined, "+919876543210"],
    ["0091-98765-43210", undefined, "+919876543210"],
    ["(555) 0100", "1", "+15550100"],
    ["098765 43210", "91", "+919876543210"],
    ["98765.43210", "91", "+919876543210"],
  ])("normalises %s (default code %s) to %s", (input, code, expected) => {
    expect(normalizePhone(input, code)).toBe(expected);
  });

  it("refuses to guess a country when none is configured", () => {
    expect(normalizePhone("98765 43210")).toBeNull();
  });

  it.each(["", "   ", "+0123456789", "+12", "+1234567890123456", "+91 98765 4321x"])(
    "rejects %j",
    (input) => {
      expect(normalizePhone(input, "91")).toBeNull();
    },
  );

  it("rejects an invalid default calling code", () => {
    expect(() => normalizePhone("98765 43210", "091")).toThrow(RangeError);
  });

  it("produces values the database will accept", () => {
    const migration = read("supabase/migrations/20261020100200_appointments.sql");
    expect(migration).toContain("normalized_phone ~ '^\\+[1-9][0-9]{6,14}$'");
    expect(E164_PATTERN.source).toBe("^\\+[1-9]\\d{6,14}$");
  });
});

describe("email", () => {
  it("normalises case and whitespace", () => {
    expect(normalizeEmail("  Visitor@Example.COM ")).toBe("visitor@example.com");
    expect(normalizeEmail("   ")).toBeNull();
  });

  it("validates format", () => {
    expect(emailSchema.safeParse("visitor@example.com").success).toBe(true);
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });
});

describe("slug", () => {
  it.each(["dua-and-wazifa", "taweez", "a1-b2"])("accepts %s", (slug) => {
    expect(SLUG_PATTERN.test(slug)).toBe(true);
  });
  it.each(["Dua", "dua--wazifa", "-dua", "dua-", "dua wazifa"])("rejects %s", (slug) => {
    expect(SLUG_PATTERN.test(slug)).toBe(false);
  });
});

describe("isValidTimeZone", () => {
  it.each(["Asia/Kolkata", "Europe/London", "America/Argentina/Buenos_Aires", "UTC"])(
    "accepts %s",
    (tz) => {
      expect(isValidTimeZone(tz)).toBe(true);
    },
  );
  it.each(["IST", "+05:30", "Asia/Nowhere", "", "asia kolkata"])("rejects %j", (tz) => {
    expect(isValidTimeZone(tz)).toBe(false);
  });
});
