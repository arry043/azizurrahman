import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ServiceForm } from "@/components/admin/service-form";
import { getAdminServiceById } from "@/lib/admin/services-admin-service";
import { requireAdminAuth } from "@/lib/auth/admin-auth";

export const metadata: Metadata = {
  title: "Edit Service",
  description: "Update consultation service details and configuration.",
  robots: { index: false, follow: false },
};

export const instant = false;

interface EditServicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({ params }: EditServicePageProps) {
  const { id } = await params;
  const { supabase } = await requireAdminAuth();

  const service = await getAdminServiceById(supabase, id);

  if (!service) {
    notFound();
  }

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
          Edit Service: {service.name}
        </h1>
        <p className="text-foreground-muted mt-1 text-sm">
          Modify service descriptions, durations, or visibility settings.
        </p>
      </div>

      <ServiceForm initialService={service} mode="edit" />
    </div>
  );
}
