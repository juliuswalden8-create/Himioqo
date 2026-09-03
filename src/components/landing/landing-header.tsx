"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe, Lock, Menu } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { LanguagePicker } from "@/components/language-picker";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Dictionary } from "@/i18n/messages";
import { setLocaleAction } from "@/lib/locale-actions";
import type { AccountType } from "@/lib/types";

const itemClass =
  "inline-flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-navy-800 transition hover:bg-navy-800/5";

export function LandingHeader({
  dict,
  locale,
  segment,
}: {
  dict: Dictionary;
  locale: string;
  segment: AccountType;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#hur-det-fungerar", label: dict.nav.how },
    { href: "#faq", label: dict.landing.faqTitle },
    { href: "#pilot", label: dict.pilot.title },
  ];

  const registerHref = segment === "private" ? "/register?segment=private" : "/register";

  return (
    <header className="border-b border-border/70 bg-white">
      <div className="container-page flex h-[4.25rem] items-center justify-between gap-3">
        <Logo />

        <nav className="flex items-center">
          <LanguagePicker
            appearance="header"
            dict={dict}
            value={locale}
            onChange={async (code) => {
              await setLocaleAction(code);
              router.refresh();
            }}
          />

          <Link href="/login" className={`${itemClass} hidden sm:inline-flex`}>
            <Lock className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            {dict.nav.login}
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className={itemClass}>
              <Menu className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              {dict.nav.menu}
            </SheetTrigger>
            <SheetContent side="right" aria-describedby={undefined}>
              <SheetHeader>
                <SheetTitle>{dict.nav.menu}</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-navy-800 hover:bg-canvas"
                  >
                    {link.label}
                  </a>
                ))}
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-navy-800 hover:bg-canvas sm:hidden"
                >
                  {dict.nav.login}
                </Link>
              </nav>
              <div className="mt-6 border-t border-border pt-6">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" aria-hidden />
                  {dict.segments.label}
                </p>
                <p className="mt-1.5 text-sm font-medium text-navy-800">
                  {dict.segments[segment].tab}
                </p>
              </div>
              <Button className="mt-6 w-full" asChild>
                <Link href={registerHref} onClick={() => setOpen(false)}>
                  {dict.landing.cta}
                </Link>
              </Button>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
}
