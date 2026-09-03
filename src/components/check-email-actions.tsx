"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/i18n/messages";
import { changeSignupEmailAction, resendVerificationAction } from "@/lib/signup-actions";

export function CheckEmailActions({ dict }: { dict: Dictionary }) {
  const [resend, resendAction, resendPending] = useActionState(
    async () => resendVerificationAction(),
    null,
  );
  const [change, changeAction, changePending] = useActionState(changeSignupEmailAction, null);
  const [open, setOpen] = useState(false);
  const errorKey = resend?.error || change?.error;
  const error = errorKey
    ? dict.errors[errorKey as keyof typeof dict.errors] ?? dict.errors.generic
    : null;

  return (
    <div className="space-y-4">
      <form action={resendAction}>
        <Button type="submit" variant="secondary" className="w-full" disabled={resendPending}>
          {dict.check.resend}
        </Button>
      </form>
      {resend && "ok" in resend ? (
        <p className="text-sm text-green-700">{dict.check.sent}</p>
      ) : null}
      <Button type="button" variant="ghost" className="w-full" onClick={() => setOpen((v) => !v)}>
        {dict.check.change}
      </Button>
      {open ? (
        <form action={changeAction} className="space-y-3">
          <Input
            name="email"
            type="email"
            required
            placeholder={dict.check.newEmail}
            autoComplete="email"
          />
          <Button type="submit" className="w-full" disabled={changePending}>
            {dict.check.changeSubmit}
          </Button>
        </form>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
