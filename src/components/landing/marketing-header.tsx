"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { Wordmark } from "@/components/brand/logo";
import { AudienceToggle, useAudience } from "@/components/landing/audience";
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

export { Wordmark } from "@/components/brand/logo";

export function MarketingHeader({ dict, locale }: { dict: Dictionary; locale: string }) {
  const router = useRouter();
  const { audience, setAudience } = useAudience();
  const [open, setOpen] = useState(false);
  const m = dict.marketing;
  const registerHref = audience === "private" ? "/register?segment=private" : "/register";

  const links = [
    { id: "how", href: "#sa-fungerar-det", label: m.nav.how },
    { id: "features", href: "#funktioner", label: m.nav.features },
    {
      id: "benefits",
      href: audience === "company" ? "#foretag" : "#fordelar",
      label: m.nav.benefits,
    },
    { id: "business", href: "#foretag", label: m.nav.business, company: true },
    { id: "pricing", href: "#priser", label: m.nav.pricing },
    { id: "faq", href: "#faq", label: m.nav.faq },
  ];

  function go(event: MouseEvent<HTMLAnchorElement>, company?: boolean) {
    setOpen(false);
    if (company) {
      event.preventDefault();
      setAudience("company", { scrollTo: "foretag" });
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ocean/95 text-ivory backdrop-blur-md">
      <div className="container-marketing flex h-[4.25rem] items-center gap-4">
        <Wordmark tone="onDark" />

        <nav className="ml-4 hidden items-center gap-0.5 lg:flex" aria-label={m.nav.main}>
          {links.map((link) => (
            <a
              key={link.id}
              href={link.href}
              onClick={(event) => {
                if (link.company) {
                  event.preventDefault();
                  setAudience("company", { scrollTo: "foretag" });
                }
              }}
              className="rounded-lg px-2.5 py-2 text-sm font-medium text-ivory/90 transition hover:bg-white/10 hover:text-ivory"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <LanguagePicker
            appearance="header-dark"
            dict={dict}
            value={locale}
            onChange={async (code) => {
              await setLocaleAction(code);
              router.refresh();
            }}
          />
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ivory/90 transition hover:bg-white/10 sm:inline-flex"
          >
            {m.nav.login}
          </Link>
          <Button size="sm" variant="cta" className="hidden sm:inline-flex" asChild>
            <Link href={registerHref}>{m.nav.getStarted}</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ivory hover:bg-white/10 lg:hidden"
              aria-label={m.nav.menu}
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </SheetTrigger>
            <SheetContent side="right" aria-describedby={undefined} className="w-[min(100vw,22rem)]">
              <SheetHeader>
                <SheetTitle className="sr-only">{m.nav.menu}</SheetTitle>
                <Wordmark tone="brand" />
              </SheetHeader>
              <div className="mt-6">
                <AudienceToggle dict={dict} />
              </div>
              <nav className="mt-6 flex flex-col gap-1">
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={(event) => go(event, link.company)}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-ocean hover:bg-sage"
                  >
                    {link.label}
                  </a>
                ))}
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-ocean hover:bg-sage"
                >
                  {m.nav.login}
                </Link>
              </nav>
              <Button variant="cta" className="mt-6 w-full" asChild>
                <Link href={registerHref} onClick={() => setOpen(false)}>
                  {m.nav.getStarted}
                </Link>
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
