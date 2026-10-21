import { describe, expect, it, vi } from "vitest";

import {
  checkRateLimit,
  clearMemoryRateLimits,
  createRateLimitHeaders,
  createRateLimitResponse,
  getClientIp,
} from "@/lib/rate-limit";

describe("Phase 13: Rate Limiting & Abuse Prevention", () => {
  describe("getClientIp", () => {
    it("extracts IP from cf-connecting-ip if present", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "cf-connecting-ip": "203.0.113.195" },
      });
      expect(getClientIp(req)).toBe("203.0.113.195");
    });

    it("extracts IP from x-vercel-forwarded-for if cf-connecting-ip is missing", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-vercel-forwarded-for": "198.51.100.22" },
      });
      expect(getClientIp(req)).toBe("198.51.100.22");
    });

    it("prioritizes x-vercel-forwarded-for over x-real-ip and x-forwarded-for", () => {
      const req = new Request("http://localhost/api/test", {
        headers: {
          "x-vercel-forwarded-for": "198.51.100.23",
          "x-real-ip": "10.0.0.99",
          "x-forwarded-for": "172.16.0.99",
        },
      });
      expect(getClientIp(req)).toBe("198.51.100.23");
    });

    it("extracts IP from x-real-ip if cf-connecting-ip and x-vercel-forwarded-for are missing", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-real-ip": "198.51.100.4" },
      });
      expect(getClientIp(req)).toBe("198.51.100.4");
    });

    it("extracts first client IP from x-forwarded-for chain", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "192.0.2.1, 10.0.0.1, 172.16.0.1" },
      });
      expect(getClientIp(req)).toBe("192.0.2.1");
    });

    it("falls back to 127.0.0.1 when no proxy headers exist", () => {
      const req = new Request("http://localhost/api/test");
      expect(getClientIp(req)).toBe("127.0.0.1");
    });

    it("accepts valid IPv6 addresses", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "2001:db8:85a3::8a2e:370:7334" },
      });
      expect(getClientIp(req)).toBe("2001:db8:85a3::8a2e:370:7334");
    });

    it("strips port from IPv4 address", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "192.0.2.1:8080" },
      });
      expect(getClientIp(req)).toBe("192.0.2.1");
    });

    it("normalizes and strips bracketed port from IPv6 address", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "[2001:DB8::1]:8080" },
      });
      expect(getClientIp(req)).toBe("2001:db8::1");
    });

    it("rejects invalid IPv4 octets (>255) and falls back safely", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "999.999.999.999" },
      });
      expect(getClientIp(req)).toBe("127.0.0.1");
    });

    it("extracts direct ip property on NextRequest when present", () => {
      const req = {
        ip: "203.0.113.50",
        headers: new Headers(),
      } as unknown as Request;
      expect(getClientIp(req)).toBe("203.0.113.50");
    });

    it("isolates unknown requests to unknown-client bucket in production", () => {
      try {
        vi.stubEnv("NODE_ENV", "production");
        const req = new Request("http://localhost/api/test");
        expect(getClientIp(req)).toBe("unknown-client");
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it("rejects malicious, injection, or malformed header inputs and falls back safely", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "<script>alert(1)</script>, 10.0.0.1" },
      });
      expect(getClientIp(req)).toBe("127.0.0.1");
    });
  });

  describe("checkRateLimit & sliding window enforcement", () => {
    it("permits requests within configured limit and decrements remaining tokens", async () => {
      clearMemoryRateLimits();
      const key = `test-ip-${Date.now()}-1`;

      const r1 = await checkRateLimit({ key, limit: 3, windowSeconds: 60 });
      expect(r1.allowed).toBe(true);
      expect(r1.currentPoints).toBe(1);
      expect(r1.remaining).toBe(2);

      const r2 = await checkRateLimit({ key, limit: 3, windowSeconds: 60 });
      expect(r2.allowed).toBe(true);
      expect(r2.currentPoints).toBe(2);
      expect(r2.remaining).toBe(1);

      const r3 = await checkRateLimit({ key, limit: 3, windowSeconds: 60 });
      expect(r3.allowed).toBe(true);
      expect(r3.currentPoints).toBe(3);
      expect(r3.remaining).toBe(0);
    });

    it("blocks requests that exceed the limit with allowed=false and positive retryAfter", async () => {
      clearMemoryRateLimits();
      const key = `test-ip-${Date.now()}-2`;

      // Consume up to limit of 2
      await checkRateLimit({ key, limit: 2, windowSeconds: 30 });
      await checkRateLimit({ key, limit: 2, windowSeconds: 30 });

      // Third request should be blocked
      const blocked = await checkRateLimit({ key, limit: 2, windowSeconds: 30 });
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.currentPoints).toBeGreaterThan(2);
      expect(blocked.retryAfter).toBeGreaterThan(0);
    });

    it("generates compliant rate limit response with HTTP 429 and retry headers", async () => {
      const mockResult = {
        allowed: false,
        currentPoints: 6,
        limit: 5,
        remaining: 0,
        resetAt: Math.floor(Date.now() / 1000) + 45,
        retryAfter: 45,
      };

      const res = createRateLimitResponse(mockResult);
      expect(res.status).toBe(429);
      expect(res.headers.get("X-RateLimit-Limit")).toBe("5");
      expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(res.headers.get("Retry-After")).toBe("45");
      expect(res.headers.get("Cache-Control")).toBe("no-store, private");

      const body = await res.json();
      expect(body.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(body.retryAfter).toBe(45);
    });

    it("generates correct rate limit headers for allowed requests", () => {
      const mockResult = {
        allowed: true,
        currentPoints: 1,
        limit: 5,
        remaining: 4,
        resetAt: 1700000000,
        retryAfter: 60,
      };

      const headers = createRateLimitHeaders(mockResult);
      expect(headers["X-RateLimit-Limit"]).toBe("5");
      expect(headers["X-RateLimit-Remaining"]).toBe("4");
      expect(headers["X-RateLimit-Reset"]).toBe("1700000000");
      expect(headers["Retry-After"]).toBeUndefined();
    });
  });
});
