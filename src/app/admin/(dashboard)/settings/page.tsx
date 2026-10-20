import type { Metadata } from "next";

import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { getAdminSiteSettings } from "@/lib/admin/settings-admin-service";
import { requireAdminAuth } from "@/lib/auth/admin-auth";

export const metadata: Metadata = {
  title: "Site Settings",
  description: "Configure scheduling horizon, slot intervals, and public contact information.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdminAuth();
  const settings = await getAdminSiteSettings(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Site & Scheduling Settings
        </h1>
        <p className="text-foreground-muted mt-1 text-sm">
          Manage operational booking parameters, booking horizon thresholds, and public contact
          coordinates.
        </p>
      </div>

      <SiteSettingsForm initialSettings={settings} />
    </div>
  );
}
