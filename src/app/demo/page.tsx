import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { GUEST_GUIDE_DEMO_HREF, startPilotHref } from "@/components/landing/links";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.demo.title, { index: true });
}

export default async function DemoPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const token = GUEST_GUIDE_DEMO_HREF;
  const features = [
    { href: `${token}/info`, title: dict.demo.wifi },
    { href: `${token}/info`, title: dict.demo.rules },
    { href: `${token}/info`, title: dict.demo.checkin },
    { href: `${token}/area`, title: dict.demo.area },
    { href: `${token}/report`, title: dict.demo.report },
    { href: token, title: dict.demo.contact },
  ];

  return (
    <div className="min-h-dvh bg-canvas">
      <SiteHeader dict={dict} locale={locale} />
      <main className="container-page max-w-2xl space-y-8 py-12">
        <p className="text-sm font-medium text-navy-600">{dict.demo.kicker}</p>
        <h1 className="font-display text-3xl font-semibold text-navy-800 sm:text-4xl">
          {dict.demo.title}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">{dict.demo.intro}</p>
        <p className="font-display text-xl font-semibold text-ocean">{dict.demo.homeName}</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <li key={feature.title}>
              <Link
                href={feature.href}
                className="block rounded-2xl border border-border bg-white px-4 py-4 text-sm font-medium text-ocean shadow-soft hover:border-ocean/30"
              >
                {feature.title}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="cta">
            <Link href={token}>{dict.demo.tryGuest}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={startPilotHref("private")}>{dict.demo.tryHost}</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{dict.demo.note}</p>
      </main>
    </div>
  );
}
