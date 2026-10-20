import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { getAdminAuth } from "@/lib/auth/admin-auth";

export const metadata: Metadata = {
  title: "Admin Sign In",
  description: "Secure administrator sign-in for the AZIZURRAHMAN appointment platform.",
  robots: { index: false, follow: false },
};

export const instant = false;

interface AdminLoginPageProps {
  searchParams?: Promise<{ error?: string }>;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  await connection();
  const auth = await getAdminAuth();
  if (auth.isAuthenticated && auth.isAdmin) {
    redirect("/admin");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  let initialError: string | undefined;

  if (resolvedParams?.error === "forbidden") {
    initialError = "Access denied. Your account does not have active administrator permissions.";
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link
            href="/"
            className="inline-block font-serif text-3xl font-semibold tracking-wide text-forest transition-colors hover:text-emerald"
          >
            {siteConfig.name}
          </Link>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Staff & Admin Portal
          </h1>
          <p className="text-foreground-muted mt-2 text-sm">
            Sign in with your authorized administrator credentials to manage appointments and
            schedules.
          </p>
        </div>

        <Card className="border-border bg-surface p-6 shadow-card sm:p-8">
          <AdminLoginForm initialError={initialError} />
        </Card>

        <div className="text-center">
          <Link
            href="/"
            className="text-foreground-muted text-xs underline transition-colors hover:text-forest"
          >
            ← Back to public website
          </Link>
        </div>
      </div>
    </div>
  );
}
