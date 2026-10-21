import "server-only";

import { type NextRequest, NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  currentPoints: number;
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp in seconds
  retryAfter: number; // Seconds to wait until reset
}

interface MemoryBucket {
  points: number;
  resetAt: number; // Unix timestamp in seconds
}

// In-memory fallback cache for when database connection is unavailable or in unit tests
const memoryStore = new Map<string, MemoryBucket>();

// Memory store cleanup helper for testing or memory management
export function clearMemoryRateLimits(): void {
  memoryStore.clear();
}

/**
 * Sanitizes and normalizes an incoming IPv4 or IPv6 string.
 * Strips port numbers (e.g. "192.0.2.1:8080" or "[2001:db8::1]:8080"), trims, and lowercases hex.
 */
export function sanitizeIp(rawIp: string): string | null {
  let cleaned = rawIp.trim().toLowerCase();

  // Strip bracketed IPv6 with port: [2001:db8::1]:8080 -> 2001:db8::1
  if (cleaned.startsWith("[") && cleaned.includes("]")) {
    const endBracket = cleaned.indexOf("]");
    cleaned = cleaned.slice(1, endBracket);
  } else if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(cleaned)) {
    // Strip IPv4 port: 192.0.2.1:8080 -> 192.0.2.1
    cleaned = cleaned.split(":")[0] ?? cleaned;
  }

  // IPv4 validation: 4 octets, each 0-255
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(cleaned)) {
    const octets = cleaned.split(".").map(Number);
    if (octets.every((o) => o >= 0 && o <= 255)) {
      return cleaned;
    }
  }

  // IPv6 validation: 2 to 45 chars of hex and colons
  if (/^[0-9a-f:]{2,45}$/.test(cleaned) && cleaned.includes(":")) {
    return cleaned;
  }

  return null;
}

/**
 * Extracts client IP safely from request, prioritizing:
 * 1. Direct NextRequest socket IP (`request.ip`)
 * 2. `cf-connecting-ip` (Cloudflare edge)
 * 3. `x-vercel-forwarded-for` (Vercel edge trusted client header)
 * 4. `x-real-ip` (Vercel / standard reverse proxy edge)
 * 5. `x-forwarded-for` (trusted leftmost client address)
 *
 * Safe fallback:
 * - Development / Test: "127.0.0.1"
 * - Production: "unknown-client" (isolated bucket distinct from local loopback)
 */
export function getClientIp(request: Request | NextRequest): string {
  // 1. Direct socket/edge IP on NextRequest
  if ("ip" in request && typeof (request as { ip?: string }).ip === "string") {
    const direct = sanitizeIp((request as { ip?: string }).ip ?? "");
    if (direct) return direct;
  }

  const headers = request.headers;

  // 2. Cloudflare trusted header
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    const sanitized = sanitizeIp(cfConnectingIp);
    if (sanitized) return sanitized;
  }

  // 3. Vercel edge trusted platform header
  const xVercelForwardedFor = headers.get("x-vercel-forwarded-for");
  if (xVercelForwardedFor) {
    const parts = xVercelForwardedFor.split(",").map((s) => s.trim());
    if (parts[0]) {
      const sanitized = sanitizeIp(parts[0]);
      if (sanitized) return sanitized;
    }
  }

  // 4. Vercel / Nginx trusted single client header
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) {
    const sanitized = sanitizeIp(xRealIp);
    if (sanitized) return sanitized;
  }

  // 5. Standard X-Forwarded-For (client is leftmost entry)
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",").map((s) => s.trim());
    if (parts[0]) {
      const sanitized = sanitizeIp(parts[0]);
      if (sanitized) return sanitized;
    }
  }

  // Fallback: local development/test uses loopback; production uses isolated unknown bucket
  return process.env.NODE_ENV === "production" ? "unknown-client" : "127.0.0.1";
}

/**
 * Checks and consumes a rate limit token using a sliding window.
 *
 * Checks against the shared PostgreSQL database via Supabase RPC to coordinate across
 * serverless instances in production, falling back to an in-memory window if the database is offline.
 */
export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = options;
  const nowSec = Math.floor(Date.now() / 1000);

  // 1. Attempt database-backed shared rate limiter
  try {
    const supabase = createServiceRoleClient();
    const rpcClient = supabase as unknown as {
      rpc: (
        fn: string,
        params: {
          p_key: string;
          p_limit: number;
          p_window_seconds: number;
        },
      ) => Promise<{
        data: unknown;
        error: { code?: string; message: string; details?: string } | null;
      }>;
    };
    const { data, error } = await rpcClient.rpc("consume_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (!error && data && typeof data === "object") {
      const res = data as {
        allowed: boolean;
        current_points: number;
        limit: number;
        reset_at: number;
        retry_after: number;
      };

      const remaining = Math.max(0, limit - res.current_points);

      return {
        allowed: res.allowed,
        currentPoints: res.current_points,
        limit: res.limit,
        remaining,
        resetAt: res.reset_at,
        retryAfter: res.retry_after,
      };
    }
  } catch {
    // Database check failed or unconfigured; proceed to in-memory fallback
  }

  // 2. Fallback to in-memory store
  const existing = memoryStore.get(key);

  if (!existing || existing.resetAt <= nowSec) {
    const newResetAt = nowSec + windowSeconds;
    memoryStore.set(key, { points: 1, resetAt: newResetAt });
    return {
      allowed: true,
      currentPoints: 1,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt: newResetAt,
      retryAfter: windowSeconds,
    };
  }

  existing.points += 1;
  const remaining = Math.max(0, limit - existing.points);
  const allowed = existing.points <= limit;
  const retryAfter = Math.max(0, existing.resetAt - nowSec);

  return {
    allowed,
    currentPoints: existing.points,
    limit,
    remaining,
    resetAt: existing.resetAt,
    retryAfter,
  };
}

/**
 * Generates standard rate-limiting headers (IETF draft / RFC 6585 compliant).
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAt),
  };

  if (!result.allowed) {
    headers["Retry-After"] = String(result.retryAfter);
  }

  return headers;
}

/**
 * Creates an HTTP 429 Too Many Requests response with standard headers and helpful error message.
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: `Too many requests. Please wait ${result.retryAfter} seconds before trying again.`,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers: {
        ...createRateLimitHeaders(result),
        "Cache-Control": "no-store, private",
      },
    },
  );
}

// ── Application Route Limit Helpers ──────────────────────────────────────────────────────────

export async function checkBookingRateLimit(ip: string): Promise<RateLimitResult> {
  // Max 5 bookings per 60 seconds per IP
  return checkRateLimit({
    key: `rl:booking:${ip}`,
    limit: 5,
    windowSeconds: 60,
  });
}

export async function checkLookupInitiateRateLimit(ip: string): Promise<RateLimitResult> {
  // Max 5 lookup requests per 10 minutes per IP
  return checkRateLimit({
    key: `rl:lookup:initiate:${ip}`,
    limit: 5,
    windowSeconds: 600,
  });
}

export async function checkLookupVerifyRateLimit(ip: string): Promise<RateLimitResult> {
  // Max 10 verification submissions per 10 minutes per IP
  return checkRateLimit({
    key: `rl:lookup:verify:${ip}`,
    limit: 10,
    windowSeconds: 600,
  });
}

export async function checkAvailabilityRateLimit(ip: string): Promise<RateLimitResult> {
  // Max 60 availability calendar queries per minute per IP
  return checkRateLimit({
    key: `rl:availability:${ip}`,
    limit: 60,
    windowSeconds: 60,
  });
}

/**
 * Purges expired rate limit records from the shared PostgreSQL database.
 */
export async function cleanupExpiredRateLimits(batchSize: number = 1000): Promise<number> {
  try {
    const supabase = createServiceRoleClient();
    const rpcClient = supabase as unknown as {
      rpc: (
        fn: string,
        params: { p_batch_size: number },
      ) => Promise<{ data: unknown; error: unknown }>;
    };
    const { data, error } = await rpcClient.rpc("cleanup_expired_rate_limits", {
      p_batch_size: batchSize,
    });
    if (!error && typeof data === "number") {
      return data;
    }
    return 0;
  } catch {
    return 0;
  }
}
