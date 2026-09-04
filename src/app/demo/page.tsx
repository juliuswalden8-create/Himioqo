import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export const dynamic = "force-dynamic";

export default async function DemoPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const steps = [
    { title: dict.demo.step1Title, text: dict.demo.step1Text },
    { title: dict.demo.step2Title, text: dict.demo.step2Text },
    { title: dict.demo.step3Title, text: dict.demo.step3Text },
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
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-border bg-white p-5 shadow-soft"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {index + 1}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-navy-800">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="cta">
            <Link href="/g/qr_strand14">{dict.demo.tryGuest}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/login">{dict.demo.tryHost}</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{dict.demo.note}</p>
      </main>
    </div>
  );
}
