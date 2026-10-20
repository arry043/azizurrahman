"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAdminAction, type LoginActionState } from "@/lib/auth/actions";

const initialState: LoginActionState = {
  success: false,
};

export function AdminLoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, isPending] = useActionState(loginAdminAction, initialState);

  const errorMessage = state.error || initialError;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {errorMessage && (
        <Alert variant="error" title="Authentication Error">
          {errorMessage}
        </Alert>
      )}

      <Input
        label="Email Address"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="admin@example.com"
        disabled={isPending}
      />

      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        placeholder="••••••••••••"
        disabled={isPending}
      />

      <Button type="submit" variant="primary" size="lg" loading={isPending} className="w-full">
        Sign In to Admin
      </Button>
    </form>
  );
}
