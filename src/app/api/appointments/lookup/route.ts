import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { initiateAppointmentLookup, verifyAppointmentLookup } from "@/lib/lookup/lookup-service";
import {
  checkLookupInitiateRateLimit,
  checkLookupVerifyRateLimit,
  createRateLimitHeaders,
  createRateLimitResponse,
  getClientIp,
} from "@/lib/rate-limit";

const initiateSchema = z.object({
  action: z.literal("initiate"),
  publicReference: z.string().min(5).max(30),
  contact: z.string().min(3).max(254),
});

const verifySchema = z.object({
  action: z.literal("verify"),
  publicReference: z.string().min(5).max(30),
  token: z.string().min(4).max(64),
});

const lookupRequestSchema = z.discriminatedUnion("action", [initiateSchema, verifySchema]);

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }

    const parsed = lookupRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 },
      );
    }

    if (parsed.data.action === "initiate") {
      const rateLimit = await checkLookupInitiateRateLimit(clientIp);
      if (!rateLimit.allowed) {
        return createRateLimitResponse(rateLimit);
      }
      const rateLimitHeaders = createRateLimitHeaders(rateLimit);

      const result = await initiateAppointmentLookup({
        publicReference: parsed.data.publicReference,
        contact: parsed.data.contact,
      });

      return NextResponse.json(result, {
        headers: {
          ...rateLimitHeaders,
          "Cache-Control": "no-store, private",
        },
      });
    }

    if (parsed.data.action === "verify") {
      const rateLimit = await checkLookupVerifyRateLimit(clientIp);
      if (!rateLimit.allowed) {
        return createRateLimitResponse(rateLimit);
      }
      const rateLimitHeaders = createRateLimitHeaders(rateLimit);

      const result = await verifyAppointmentLookup({
        publicReference: parsed.data.publicReference,
        token: parsed.data.token,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          {
            status: 401,
            headers: {
              ...rateLimitHeaders,
              "Cache-Control": "no-store, private",
            },
          },
        );
      }

      return NextResponse.json(
        {
          success: true,
          receipt: result.receipt,
        },
        {
          headers: {
            ...rateLimitHeaders,
            "Cache-Control": "no-store, private",
          },
        },
      );
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred during appointment verification." },
      { status: 500 },
    );
  }
}
