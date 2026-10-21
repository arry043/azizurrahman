import type { Metadata } from "next";
import type { ReactNode } from "react";
import { connection } from "next/server";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminAuth } from "@/lib/auth/admin-auth";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  await connection();
  const session = await requireAdminAuth();

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground antialiased">
      <AdminSidebar profile={session.profile} userEmail={session.user.email} />
      <div className="flex w-full max-w-full min-w-0 flex-1 flex-col overflow-x-hidden md:pl-64">
        <AdminHeader profile={session.profile} userEmail={session.user.email} />
        <main
          id="main-content"
          tabIndex={-1}
          className="w-full max-w-full min-w-0 flex-1 p-3.5 focus:outline-none sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
