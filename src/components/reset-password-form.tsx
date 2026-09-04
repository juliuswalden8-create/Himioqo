"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormError, FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/i18n/messages";
import { resetPasswordAction } from "@/lib/actions";

export function ResetPasswordForm({ dict, token }: { dict: Dictionary; token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, null);
  const error =
    state?.error === "mismatch"
      ? dict.verify.mismatch
      : state?.error
        ? dict.errors[state.error as keyof typeof dict.errors] ?? dict.errors.generic
        : null;

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <FormField label={dict.verify.password} htmlFor="password" required>
        <Input id="password" name="password" type="password" minLength={8} required />
      </FormField>
      <FormField label={dict.verify.confirm} htmlFor="confirm" required>
        <Input id="confirm" name="confirm" type="password" minLength={8} required />
      </FormField>
      {error ? <FormError>{error}</FormError> : null}
      {state && "ok" in state && state.ok ? (
        <p className="text-sm text-green-700">{dict.forgot.sent}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? dict.verify.continuing : dict.verify.continue}
      </Button>
    </form>
  );
}
