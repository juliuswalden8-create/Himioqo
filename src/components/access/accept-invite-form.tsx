"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormError, FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/i18n/messages";
import { acceptInviteAction } from "@/lib/access-actions";

export function AcceptInviteForm({
  dict,
  token,
  email,
}: {
  dict: Dictionary;
  token: string;
  email: string;
}) {
  const [state, action, pending] = useActionState(acceptInviteAction, null);

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-sm text-navy-700">{email}</p>
      <FormField label={dict.access.firstName} htmlFor="firstName">
        <Input id="firstName" name="firstName" autoComplete="given-name" />
      </FormField>
      <FormField label={dict.access.lastName} htmlFor="lastName">
        <Input id="lastName" name="lastName" autoComplete="family-name" />
      </FormField>
      <FormField label={dict.access.setPassword} htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} />
      </FormField>
      {state?.error ? (
        <FormError>
          {dict.errors[state.error as keyof typeof dict.errors] ?? dict.errors.generic}
        </FormError>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? dict.access.accepting : dict.access.accept}
      </Button>
    </form>
  );
}
