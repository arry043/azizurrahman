import type { Metadata } from "next";
import Link from "next/link";

import { ServicesTable } from "@/components/admin/services-table";
import { getAdminServices } from "@/lib/admin/services-admin-service";
import { requireAdminAuth } from "@/lib/auth/admin-auth";

export const metadata: Metadata = {
  title: "Manage Services",
  description: "Create, edit, activate, and reorder spiritual consultation services.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminServicesPage() {
  const { supabase } = await requireAdminAuth();
  const services = await getAdminServices(supabase);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Consultation Services
          </h1>
          <p className="text-foreground-muted mt-1 text-sm">
            Configure consultation offerings, durations, buffer intervals, and public catalog
            visibility.
          </p>
        </div>

        <Link
          href="/admin/services/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
        >
          + Add New Service
        </Link>
      </div>

      <div className="text-foreground-muted space-y-1 rounded-lg border border-border bg-surface-muted/40 p-4 text-xs">
        <p className="font-semibold text-foreground">Historical Snapshot Integrity</p>
        <p>
          Changes made to service titles, durations, or buffers apply to future bookings only.
          Existing confirmed or past appointments retain their immutable snapshot data as originally
          booked.
        </p>
      </div>

      <ServicesTable initialServices={services} />
    </div>
  );
}
