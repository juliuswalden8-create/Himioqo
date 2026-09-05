"use client";

import Link from "next/link";
import { useAudience } from "@/components/landing/audience";
import { BOOK_DEMO_HREF, PRODUCT_DEMO_HREF, startPilotHref } from "@/components/landing/links";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/messages";

export function GetStarted({ dict }: { dict: Dictionary }) {
  const { audience } = useAudience();
  const m = dict.marketing.start;
  const primaryHref = audience === "company" ? BOOK_DEMO_HREF : startPilotHref("private");
  const primaryLabel = audience === "company" ? dict.marketing.cta.book : m.cta;

  return (
    <section className="py-14 lg:py-16">
      <div className="container-marketing">
        <h2 className="max-w-xl font-display text-3xl font-semibold text-ocean sm:text-4xl">
          {m.title}
        </h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {m.steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-3xl border border-sand-200 bg-white p-5 shadow-soft"
            >
              <p className="font-display text-2xl font-semibold text-ocean">0{index + 1}</p>
              <h3 className="mt-3 font-display text-xl font-semibold text-ocean">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" variant="cta" asChild>
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href={PRODUCT_DEMO_HREF}>{dict.marketing.cta.demo}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
