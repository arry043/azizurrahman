import Link from "next/link";

import { AdminMobileNavToggle } from "@/components/admin/admin-nav";
import type { AdminProfile } from "@/lib/auth/admin-auth";
import { getConsultationTimeZone } from "@/lib/env/server";

interface AdminHeaderProps {
  profile: AdminProfile;
  userEmail?: string;
}

export function AdminHeader({ profile, userEmail }: AdminHeaderProps) {
  const timezone = getConsultationTimeZone();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full max-w-full items-center justify-between border-b border-border bg-surface px-3 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2.5 sm:gap-4">
        <AdminMobileNavToggle adminName={profile.display_name} adminEmail={userEmail} />
        <div className="hidden sm:block">
          <span className="text-xs font-semibold tracking-wider text-accent-strong uppercase">
            Operations Portal
          </span>
          <p className="text-foreground-muted text-sm font-medium">
            Zone: <span className="font-mono text-xs text-foreground">{timezone}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground-muted inline-flex min-h-[44px] items-center gap-1.5 px-2 text-xs font-medium transition-colors hover:text-forest"
        >
          <span>Live Site</span>
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </Link>

        <div className="flex items-center gap-2 rounded-full border border-border bg-surface-muted/60 py-1 pr-3 pl-2.5 sm:gap-2.5 sm:pr-4 sm:pl-3">
          <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden="true" />
          <div className="flex flex-col text-left">
            <span className="max-w-[110px] truncate text-xs font-semibold text-foreground sm:max-w-none">
              {profile.display_name || "Admin"}
            </span>
            {userEmail && (
              <span className="text-foreground-muted hidden text-[10px] md:inline">
                {userEmail}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
