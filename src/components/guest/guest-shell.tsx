import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { GuestLocale } from "@/components/guest/guest-locale";
import type { Dictionary } from "@/i18n/messages";
import { cn } from "@/lib/utils";

export function GuestShell({
  children,
  dict,
  locale,
  backHref,
  className,
}: {
  children: ReactNode;
  dict: Dictionary;
  locale: string;
  backHref?: string;
  className?: string;
}) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 px-4">
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 text-sm font-medium text-navy-700"
            >
              <ChevronLeft className="h-4 w-4" />
              {dict.guide.back}
            </Link>
          ) : (
            <Logo />
          )}
          <GuestLocale locale={locale} dict={dict} />
        </div>
      </header>
      <main className={cn("mx-auto w-full max-w-lg px-4 py-6", className)}>{children}</main>
    </div>
  );
}
