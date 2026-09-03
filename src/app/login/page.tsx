"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoLoginAction, loginAction } from "@/lib/actions";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/constants";

const ERRORS: Record<string, string> = {
  login: "Fel e-post eller lösenord.",
  unverified: "Bekräfta din e-postadress innan du loggar in.",
};

export default function LoginPage() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => loginAction(formData),
    null,
  );

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-3xl border border-border bg-white p-7 shadow-soft">
          <h1 className="text-xl font-semibold text-navy-800">Logga in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            För förvaltare och uthyrningsbolag.
          </p>
          <form action={action} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={DEMO_EMAIL}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Lösenord</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                defaultValue={DEMO_PASSWORD}
                required
              />
            </div>
            {state?.error ? (
              <p className="text-sm text-destructive">
                {ERRORS[state.error] ?? "Något gick fel."}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Loggar in…" : "Logga in"}
            </Button>
          </form>
          <form action={demoLoginAction} className="mt-2">
            <Button type="submit" variant="secondary" className="w-full">
              Öppna demokontot
            </Button>
          </form>
          <div className="mt-5 flex flex-col gap-2 text-center text-sm">
            <Link href="/forgot-password" className="text-navy-600 hover:underline">
              Glömt lösenord?
            </Link>
            <p className="text-muted-foreground">
              Inget konto?{" "}
              <Link href="/register" className="font-medium text-navy-800 hover:underline">
                Testa Homioqo kostnadsfritt
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
