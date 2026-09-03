"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { FormError, FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/i18n/messages";
import { demoLoginAction, loginAction } from "@/lib/actions";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/constants";

export function LoginForm({ dict, next }: { dict: Dictionary; next: string }) {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-3xl border border-border bg-white p-7 shadow-soft">
          <h1 className="text-xl font-semibold text-navy-800">{dict.login.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{dict.login.subtitle}</p>
          <form action={action} className="mt-6 space-y-4">
            <input type="hidden" name="next" value={next} />
            <FormField label={dict.login.email} htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={DEMO_EMAIL}
                required
              />
            </FormField>
            <FormField label={dict.login.password} htmlFor="password" required>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                defaultValue={DEMO_PASSWORD}
                required
              />
            </FormField>
            {state?.error ? (
              <FormError>
                {dict.errors[state.error as keyof typeof dict.errors] ?? dict.errors.generic}
              </FormError>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? dict.login.loggingIn : dict.login.submit}
            </Button>
          </form>
          <form action={demoLoginAction} className="mt-2">
            <Button type="submit" variant="secondary" className="w-full">
              {dict.login.demo}
            </Button>
          </form>
          <div className="mt-5 flex flex-col gap-2 text-center text-sm">
            <Link href="/forgot-password" className="text-navy-600 hover:underline">
              {dict.login.forgot}
            </Link>
            <p className="text-muted-foreground">
              {dict.login.none}{" "}
              <Link href="/register" className="font-medium text-navy-800 hover:underline">
                {dict.nav.tryFree}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
