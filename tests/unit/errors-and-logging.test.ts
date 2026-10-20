import { describe, expect, it, vi } from "vitest";

import { AppError, fail, mapDatabaseError, ok, toPublicError } from "@/lib/errors";
import { logger, redact } from "@/lib/logger";

describe("error contract", () => {
  it("passes AppError details through", () => {
    const error = new AppError("VALIDATION_FAILED", { fieldErrors: { phone: ["Required"] } });
    expect(toPublicError(error)).toEqual({
      code: "VALIDATION_FAILED",
      message: expect.any(String),
      fieldErrors: { phone: ["Required"] },
    });
  });

  it("hides unknown errors behind a generic message", () => {
    const leaked = new Error('relation "appointments" violates ... at /srv/app.js:12');
    const result = toPublicError(leaked);
    expect(result.code).toBe("INTERNAL_ERROR");
    expect(result.message).not.toContain("appointments");
  });

  it("builds discriminated results", () => {
    expect(ok(1)).toEqual({ ok: true, data: 1 });
    expect(fail("NOT_FOUND").error.code).toBe("NOT_FOUND");
  });

  it.each([
    [
      {
        code: "23P01",
        message: 'conflicting key value violates exclusion constraint "appointments_no_overlap"',
      },
      "SLOT_UNAVAILABLE",
    ],
    [
      {
        code: "23505",
        message:
          'duplicate key value violates unique constraint "appointments_one_active_per_phone_per_day"',
      },
      "DAILY_LIMIT_REACHED",
    ],
    [
      { code: "P0001", message: "invalid appointment status transition: confirmed -> pending" },
      "INVALID_STATUS_TRANSITION",
    ],
    [
      { code: "23514", message: 'violates check constraint "appointments_email_format"' },
      "VALIDATION_FAILED",
    ],
    [{ code: "42501", message: "new row violates row-level security policy" }, "FORBIDDEN"],
    [
      {
        code: "23505",
        message: 'duplicate key value violates unique constraint "services_slug_key"',
      },
      "INTERNAL_ERROR",
    ],
    [{ code: "XX000", message: "boom" }, "INTERNAL_ERROR"],
  ])("maps %o to %s", (dbError, code) => {
    expect(mapDatabaseError(dbError).code).toBe(code);
  });
});

describe("logger redaction", () => {
  it("redacts sensitive keys recursively", () => {
    expect(
      redact({
        event: "booking",
        phone: "+919876543210",
        nested: { email: "a@b.c", apiKey: "secret", serviceId: "svc" },
        list: [{ token: "t" }],
      }),
    ).toEqual({
      event: "booking",
      phone: "[REDACTED]",
      nested: { email: "[REDACTED]", apiKey: "[REDACTED]", serviceId: "svc" },
      list: [{ token: "[REDACTED]" }],
    });
  });

  it("writes structured JSON without sensitive values", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("booking_failed", { reference: "AZR-ABCDE-FGHIJ", customerName: "Jane" });
    const line = String(spy.mock.calls[0]?.[0]);
    expect(JSON.parse(line)).toMatchObject({
      level: "error",
      event: "booking_failed",
      context: { reference: "AZR-ABCDE-FGHIJ", customerName: "[REDACTED]" },
    });
    expect(line).not.toContain("Jane");
  });
});
