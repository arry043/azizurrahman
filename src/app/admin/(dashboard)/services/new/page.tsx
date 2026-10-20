import type { Metadata } from "next";
import Link from "next/link";

import { ServiceForm } from "@/components/admin/service-form";
import { requireAdminAuth } from "@/lib/auth/admin-auth";

export const metadata: Metadata = {
  title: "New Service",
  description: "Create a new consultation service.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function NewServicePage() {
  await requireAdminAuth();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/services"
          className="text-foreground-muted text-xs font-medium transition-colors hover:text-primary"
        >
          ← Back to Services
        </Link>
        <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Create New Service
        </h1>
        <p className="text-foreground-muted mt-1 text-sm">
          Define the title, consultation duration, buffers, and descriptions for a new offering.
        </p>
      </div>

      <ServiceForm mode="create" />
    </div>
  );
}
