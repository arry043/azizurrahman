import Link from "next/link";

import { AdminNavLinks, AdminSignOutButton } from "@/components/admin/admin-nav";
import { siteConfig } from "@/config/site";
import type { AdminProfile } from "@/lib/auth/admin-auth";

interface AdminSidebarProps {
  profile: AdminProfile;
  userEmail?: string;
}

export function AdminSidebar({ profile, userEmail }: AdminSidebarProps) {
  return (
    <aside
      className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col md:border-r md:border-border/20 md:bg-forest md:text-foreground-inverse"
      aria-label="Admin navigation sidebar"
    >
      <div className="flex h-16 shrink-0 items-center border-b border-border/20 px-6">
        <Link href="/admin" className="flex flex-col">
          <span className="font-serif text-lg font-bold tracking-wide text-white">
            {siteConfig.name}
          </span>
          <span className="text-[10px] font-semibold tracking-wider text-accent uppercase">
            Management Suite
          </span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-6">
        <div className="space-y-6">
          <div className="rounded-lg border border-border/15 bg-emerald/20 p-3">
            <p className="text-xs font-semibold text-white">
              {profile.display_name || "Administrator"}
            </p>
            {userEmail && (
              <p className="truncate text-[11px] text-foreground-inverse/70">{userEmail}</p>
            )}
            <div className="mt-2 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-success" />
              <span className="text-[10px] tracking-wider text-accent uppercase">Active Admin</span>
            </div>
          </div>

          <AdminNavLinks />
        </div>

        <div className="border-t border-border/20 pt-4">
          <AdminSignOutButton />
        </div>
      </div>
    </aside>
  );
}
