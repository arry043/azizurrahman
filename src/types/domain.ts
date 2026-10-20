import type { Database } from "./database.types";

/**
 * Domain aliases over the generated Supabase types (src/types/database.types.ts).
 * Regenerate the generated file with `npm run db:types` after every migration; never edit it by hand.
 */

type PublicSchema = Database["public"];
export type TableRow<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];

export type AppointmentStatus = PublicSchema["Enums"]["appointment_status"];
export type ContactMethod = PublicSchema["Enums"]["contact_method"];

export type ServiceRow = TableRow<"services">;
export type AppointmentRow = TableRow<"appointments">;
export type AppointmentServiceRow = TableRow<"appointment_services">;
export type WeeklyAvailabilityRow = TableRow<"weekly_availability">;
export type WeeklyIntervalRow = TableRow<"weekly_availability_intervals">;
export type DateOverrideRow = TableRow<"date_overrides">;
export type SiteSettingsRow = TableRow<"site_settings">;
export type NotificationLogRow = TableRow<"notification_logs">;

/** Fields a visitor may ever see about a service. */
export type PublicService = Pick<
  ServiceRow,
  "id" | "slug" | "name" | "short_description" | "description" | "image_url" | "duration_minutes"
>;

/**
 * Fields that may appear on a receipt or lookup response. Deliberately excludes contact details
 * beyond what the visitor submitted, `private_admin_notes`, internal ids and audit data.
 */
export type PublicAppointmentReceipt = Pick<
  AppointmentRow,
  "public_reference" | "status" | "appointment_start" | "appointment_end" | "timezone"
> & {
  readonly services: readonly Pick<
    AppointmentServiceRow,
    "service_name_snapshot" | "duration_minutes_snapshot"
  >[];
};

/** Weekday numbering used across the app and database: 0 = Sunday … 6 = Saturday. */
export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
