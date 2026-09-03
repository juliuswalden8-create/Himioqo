"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { LanguagePicker } from "@/components/language-picker";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/messages";
import { setLocaleAction } from "@/lib/locale-actions";

export function SiteHeader({
  dict,
  locale,
  ctaLabel,
}: {
  dict: Dictionary;
  locale: string;
  ctaLabel?: string;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-canvas/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Logo />
        <nav className="flex min-w-0 items-center gap-1 sm:gap-2">
          <LanguagePicker
            compact
            dict={dict}
            value={locale}
            onChange={async (code) => {
              await setLocaleAction(code);
              router.refresh();
            }}
          />
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/login">{dict.nav.login}</Link>
          </Button>
          <Button size="sm" variant="cta" asChild>
            <Link href="/register">{ctaLabel ?? dict.nav.try}</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
