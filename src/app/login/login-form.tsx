"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Building2, HardHat, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { FormError, FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/i18n/messages";
import { loginWithIntentAction, magicLinkAction } from "@/lib/access-actions";
import type { LoginIntent } from "@/lib/types";

const ROLES: { id: LoginIntent; icon: typeof Building2 }[] = [
  { id: "host", icon: Building2 },
  { id: "cleaner", icon: Sparkles },
  { id: "contractor", icon: HardHat },
];

export function LoginForm({ dict, next }: { dict: Dictionary; next: string }) {
  const [intent, setIntent] = useState<LoginIntent | null>(null);
  const [email, setEmail] = useState("");
  const [state, action, pending] = useActionState(loginWithIntentAction, null);
  const [magic, magicAction, magicPending] = useActionState(magicLinkAction, null);

  const errorText = state?.error
    ? dict.errors[state.error as keyof typeof dict.errors] ?? dict.errors.generic
    : null;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-3xl border border-border bg-white p-7 shadow-soft">
          <h1 className="text-xl font-semibold text-navy-800">{dict.login.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{dict.login.subtitle}</p>

          {!intent ? (
            <div className="mt-6 grid gap-3">
              {ROLES.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setIntent(role.id)}
                    className="flex min-h-16 items-center gap-4 rounded-2xl border border-border bg-white px-4 py-4 text-left shadow-soft hover:border-navy-800"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy-800">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span>
                      <span className="block text-base font-semibold text-navy-800">
                        {dict.login.roles[role.id]}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {dict.login.roleHelp[role.id]}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <button
                type="button"
                className="mt-4 min-h-11 text-sm font-medium text-navy-700 underline"
                onClick={() => setIntent(null)}
              >
                {dict.login.back}
              </button>
              <p className="mt-3 text-sm font-medium text-navy-800">{dict.login.roles[intent]}</p>
              <form action={action} className="mt-4 space-y-4">
                <input type="hidden" name="next" value={next} />
                <input type="hidden" name="intent" value={intent} />
                <FormField label={dict.login.email} htmlFor="email" required>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </FormField>
                <FormField label={dict.login.password} htmlFor="password" required>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </FormField>
                {errorText ? <FormError>{errorText}</FormError> : null}
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? dict.login.loggingIn : dict.login.submit}
                </Button>
              </form>
              <form action={magicAction} className="mt-3 space-y-2">
                <input type="hidden" name="intent" value={intent} />
                <input type="hidden" name="email" value={email} />
                <p className="text-center text-xs text-muted-foreground">{dict.login.or}</p>
                <Button type="submit" variant="secondary" className="w-full" disabled={magicPending}>
                  {magicPending ? dict.login.magicSending : dict.login.magicLink}
                </Button>
                {magic?.sent ? (
                  <p className="text-center text-sm text-green-700">{dict.login.magicSent}</p>
                ) : null}
                {magic?.error ? (
                  <FormError>
                    {dict.errors[magic.error as keyof typeof dict.errors] ?? dict.errors.generic}
                  </FormError>
                ) : null}
              </form>
            </>
          )}

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
            <p className="pt-2 text-sm leading-relaxed text-muted-foreground">
              {dict.login.guestNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
