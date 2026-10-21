import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { POST as bookingHandler } from "@/app/api/bookings/route";
import { POST as lookupHandler } from "@/app/api/appointments/lookup/route";
import { GET as availabilityHandler } from "@/app/api/availability/route";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const configured = Boolean(url);

describe.skipIf(!configured)("Rate Limiting API Integration", () => {
  it("enforces rate limits on /api/bookings and returns HTTP 429 with RFC headers", async () => {
    const testIp = `203.0.113.${Math.floor(Math.random() * 200 + 10)}`;

    // Limit for bookings is 5 requests per 60s
    for (let i = 0; i < 5; i++) {
      const req = new NextRequest("http://localhost:3000/api/bookings", {
        method: "POST",
        headers: {
          "x-forwarded-for": testIp,
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const res = await bookingHandler(req);
      // Not 429 (likely 400 due to invalid schema)
      expect(res.status).not.toBe(429);
      expect(res.headers.get("x-ratelimit-limit")).toBe("5");
      expect(Number(res.headers.get("x-ratelimit-remaining"))).toBe(5 - (i + 1));
    }

    // 6th request must trigger rate limit
    const blockedReq = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: {
        "x-forwarded-for": testIp,
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const blockedRes = await bookingHandler(blockedReq);
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get("retry-after")).toBeDefined();
    expect(Number(blockedRes.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(blockedRes.headers.get("x-ratelimit-remaining")).toBe("0");

    const json = await blockedRes.json();
    expect(json.code).toBe("RATE_LIMIT_EXCEEDED");
  });

  it("enforces rate limits on /api/appointments/lookup initiate", async () => {
    const testIp = `203.0.114.${Math.floor(Math.random() * 200 + 10)}`;

    // Limit is 5 per 10min for initiate
    for (let i = 0; i < 5; i++) {
      const req = new NextRequest("http://localhost:3000/api/appointments/lookup", {
        method: "POST",
        headers: {
          "x-forwarded-for": testIp,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "initiate",
          publicReference: "REF-TEST-0000",
          contact: "+15555550100",
        }),
      });

      const res = await lookupHandler(req);
      expect(res.status).not.toBe(429);
      expect(res.headers.get("x-ratelimit-limit")).toBe("5");
      expect(Number(res.headers.get("x-ratelimit-remaining"))).toBe(5 - (i + 1));
    }

    // 6th request blocked
    const blockedReq = new NextRequest("http://localhost:3000/api/appointments/lookup", {
      method: "POST",
      headers: {
        "x-forwarded-for": testIp,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        action: "initiate",
        publicReference: "REF-TEST-0000",
        contact: "+15555550100",
      }),
    });

    const blockedRes = await lookupHandler(blockedReq);
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get("retry-after")).toBeDefined();
    expect(blockedRes.headers.get("x-ratelimit-remaining")).toBe("0");
  });

  it("handles availability rate limiting gracefully", async () => {
    const testIp = `203.0.115.${Math.floor(Math.random() * 200 + 10)}`;

    const req = new NextRequest(
      "http://localhost:3000/api/availability?month=2026-11&services=00000000-0000-4000-8000-000000000101",
      {
        method: "GET",
        headers: {
          "x-forwarded-for": testIp,
        },
      },
    );

    const res = await availabilityHandler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("x-ratelimit-limit")).toBe("60");
    expect(res.headers.get("x-ratelimit-remaining")).toBe("59");
  });

  it("permits service-role caller to purge expired rate limits without error", async () => {
    const { cleanupExpiredRateLimits } = await import("@/lib/rate-limit");
    const count = await cleanupExpiredRateLimits(500);
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
