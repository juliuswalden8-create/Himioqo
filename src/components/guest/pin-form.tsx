"use client";

import { useActionState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { FormError, FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/i18n/messages";
import { unlockGuestAction } from "@/lib/access-actions";

export function GuestPinForm({
  dict,
  token,
  propertyName,
}: {
  dict: Dictionary;
  token: string;
  propertyName: string;
}) {
  const [state, action, pending] = useActionState(unlockGuestAction, null);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-3xl border border-border bg-white p-7 shadow-soft">
          <p className="text-sm text-muted-foreground">{propertyName}</p>
          <h1 className="mt-1 text-xl font-semibold text-navy-800">{dict.guide.pinTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{dict.guide.pinHelp}</p>
          <form action={action} className="mt-6 space-y-4">
            <input type="hidden" name="token" value={token} />
            <FormField label={dict.guide.pinLabel} htmlFor="guest-pin" required>
              <Input
                id="guest-pin"
                name="pin"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </FormField>
            {state?.error ? (
              <FormError>
                {dict.errors[state.error as keyof typeof dict.errors] ?? dict.errors.generic}
              </FormError>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? dict.guide.pinUnlocking : dict.guide.pinSubmit}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
