import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createGuestBooking } from "@/lib/booking/booking-service";
import {
  checkBookingRateLimit,
  createRateLimitHeaders,
  createRateLimitResponse,
  getClientIp,
} from "@/lib/rate-limit";

const bookingSchema = z.object({
  customerName: z.string().min(1, "Name is required").max(120, "Name cannot exceed 120 characters"),
  phoneNumber: z.string().min(5, "Phone number is too short").max(32, "Phone number is too long"),
  email: z.string().email("Invalid email format").max(254).optional().nullable().or(z.literal("")),
  preferredContactMethod: z.enum(["phone", "whatsapp", "email"]).optional().nullable(),
  message: z
    .string()
    .max(1000, "Message cannot exceed 1000 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  serviceIds: z
    .array(z.string().uuid("Invalid service ID"))
    .min(1, "At least one service must be selected")
    .max(5, "Maximum 5 services per appointment"),
  dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:mm format"),
  idempotencyKey: z.string().min(16).max(128).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = await checkBookingRateLimit(clientIp);

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit);
    }

    const rateLimitHeaders = createRateLimitHeaders(rateLimit);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400, headers: rateLimitHeaders },
      );
    }

    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400, headers: rateLimitHeaders },
      );
    }

    const headerIdempotency = request.headers.get("Idempotency-Key");
    const idempotencyKey = parsed.data.idempotencyKey || headerIdempotency || undefined;

    const result = await createGuestBooking({
      ...parsed.data,
      email: parsed.data.email || null,
      message: parsed.data.message || null,
      preferredContactMethod: parsed.data.preferredContactMethod || null,
      idempotencyKey,
    });

    if (!result.success) {
      const isConflict =
        result.code === "SLOT_CONFLICT" ||
        result.code === "DAILY_LIMIT_EXCEEDED" ||
        result.code === "SLOT_UNAVAILABLE";
      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
        },
        { status: isConflict ? 409 : 400, headers: rateLimitHeaders },
      );
    }

    return NextResponse.json(
      {
        success: true,
        receipt: result.receipt,
      },
      {
        status: 200,
        headers: {
          ...rateLimitHeaders,
          "Cache-Control": "no-store, private",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        error: "An unexpected error occurred while processing your booking. Please try again.",
      },
      { status: 500 },
    );
  }
}
