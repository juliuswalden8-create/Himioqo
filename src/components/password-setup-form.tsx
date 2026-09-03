"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/i18n/messages";
import { setPasswordAfterVerifyAction } from "@/lib/signup-actions";

export function PasswordSetupForm({
  dict,
  profileId,
}: {
  dict: Dictionary;
  profileId: string;
}) {
  const [state, action, pending] = useActionState(setPasswordAfterVerifyAction, null);
  const error =
    state?.error === "mismatch"
      ? dict.verify.mismatch
      : state?.error
        ? dict.errors[state.error as keyof typeof dict.errors] ?? dict.errors.generic
        : null;

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="profileId" value={profileId} />
      <div className="space-y-1.5">
        <Label htmlFor="password">{dict.verify.password}</Label>
        <Input id="password" name="password" type="password" minLength={8} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">{dict.verify.confirm}</Label>
        <Input id="confirm" name="confirm" type="password" minLength={8} required />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? dict.verify.continuing : dict.verify.continue}
      </Button>
    </form>
  );
}
