import Link from "next/link";
import { GuestLocale } from "@/components/guest/guest-locale";
import type { Dictionary } from "@/i18n/messages";

export function NotFoundState({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: string;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-canvas px-4">
      <div className="absolute right-4 top-4">
        <GuestLocale locale={locale} dict={dict} />
      </div>
      <div className="text-center">
        <h1 className="text-xl font-semibold text-navy-800">{dict.errors.notFoundTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{dict.errors.notFoundBody}</p>
        <p className="mt-4">
          <Link href="/" className="text-sm font-medium text-navy-800 underline">
            {dict.errors.notFoundHome}
          </Link>
        </p>
      </div>
    </div>
  );
}
