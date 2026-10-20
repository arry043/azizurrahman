import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  getPublicDayAvailability,
  getPublicMonthAvailability,
} from "@/lib/availability/availability-service";

const querySchema = z
  .object({
    month: z
      .string()
      .regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, "month must be in YYYY-MM format")
      .optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format")
      .optional(),
    services: z
      .string()
      .min(1, "services query parameter is required")
      .transform((val) => val.split(",").map((s) => s.trim()))
      .pipe(
        z
          .array(z.string().uuid("Each service ID must be a valid UUID"))
          .min(1, "At least one service ID must be specified")
          .max(10, "Cannot request availability for more than 10 services at once"),
      ),
  })
  .refine((data) => Boolean(data.month || data.date), {
    message: "Either month (YYYY-MM) or date (YYYY-MM-DD) must be provided",
  });

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawParams = {
      month: searchParams.get("month") || undefined,
      date: searchParams.get("date") || undefined,
      services: searchParams.get("services") || undefined,
    };

    const parsed = querySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid availability request",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 },
      );
    }

    const { month, date, services: serviceIds } = parsed.data;

    if (date) {
      const dayAvailability = await getPublicDayAvailability({
        dateStr: date,
        serviceIds,
      });

      return NextResponse.json(
        {
          success: true,
          data: dayAvailability,
        },
        {
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        },
      );
    }

    if (month) {
      const [yearStr, monthStr] = month.split("-");
      const year = Number(yearStr);
      const monthNum = Number(monthStr);

      const monthAvailability = await getPublicMonthAvailability({
        year,
        month: monthNum,
        serviceIds,
      });

      return NextResponse.json(
        {
          success: true,
          data: monthAvailability,
        },
        {
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        },
      );
    }

    return NextResponse.json({ error: "Missing date or month parameter" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load availability";
    return NextResponse.json(
      {
        error: message.includes("inactive or invalid")
          ? message
          : "An error occurred while calculating availability. Please try again.",
      },
      { status: 400 },
    );
  }
}
