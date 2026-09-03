"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction } from "@/lib/actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; ok?: boolean } | null, formData: FormData) =>
      forgotPasswordAction(formData),
    null,
  );

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-3xl border border-border bg-white p-7 shadow-soft">
          <h1 className="text-xl font-semibold text-navy-800">Återställ lösenord</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ange din e-post så skickar vi en länk om kontot finns.
          </p>
          <form action={action} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-post</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            {state?.error ? (
              <p className="text-sm text-destructive">Ange en giltig e-postadress.</p>
            ) : null}
            {state && "ok" in state ? (
              <p className="text-sm text-green-700">Om adressen finns hos oss har vi skickat ett mejl.</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              Skicka länk
            </Button>
          </form>
          <p className="mt-5 text-center text-sm">
            <Link href="/login" className="font-medium text-navy-800 hover:underline">
              Tillbaka till inloggning
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
