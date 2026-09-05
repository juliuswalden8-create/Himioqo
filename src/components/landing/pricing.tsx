"use client";

import Link from "next/link";
import { useAudience } from "@/components/landing/audience";
import { BOOK_DEMO_HREF, startPilotHref } from "@/components/landing/links";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/messages";
import { cn } from "@/lib/utils";

export function Pricing({ dict }: { dict: Dictionary }) {
  const { audience } = useAudience();
  const m = dict.marketing.pricing;
  const plans = [
    {
      key: "private" as const,
      plan: m.private,
      href: startPilotHref("private"),
      aside: m.private.extra,
    },
    {
      key: "company" as const,
      plan: m.company,
      href: BOOK_DEMO_HREF,
      aside: m.company.volume,
    },
  ];

  return (
    <section id="priser" className="scroll-mt-[5.75rem] py-16 lg:py-20">
      <div className="container-marketing">
        <h2 className="max-w-xl font-display text-3xl font-semibold text-ocean sm:text-4xl">
          {m.title}
        </h2>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {plans.map(({ key, plan, href, aside }) => {
            const featured = audience === key;
            return (
              <article
                key={key}
                className={cn(
                  "flex flex-col rounded-[1.75rem] border p-8 shadow-soft",
                  featured ? "border-ocean bg-ocean text-white" : "border-sand-200 bg-white",
                )}
              >
                <h3 className="font-display text-2xl font-semibold">{plan.name}</h3>
                <p className={cn("mt-2 text-sm leading-relaxed", featured ? "text-white/75" : "text-navy-600")}>
                  {plan.blurb}
                </p>

                <p
                  className={cn(
                    "mt-6 rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    featured ? "bg-white/10" : "bg-sage/80 text-ocean",
                  )}
                >
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
                    {m.freeNow}
                  </span>
                  <span className="mt-1 block">{plan.pilot}</span>
                </p>

                <div className="mt-5">
                  <p className={cn("text-xs font-semibold uppercase tracking-[0.14em]", featured ? "text-white/60" : "text-navy-400")}>
                    {m.afterPilot}
                  </p>
                  <p className="mt-1 font-display text-xl font-semibold">{plan.afterPrice}</p>
                  {aside ? (
                    <p className={cn("mt-2 text-sm leading-relaxed", featured ? "text-white/75" : "text-navy-600")}>
                      {aside}
                    </p>
                  ) : null}
                </div>

                <div className={cn("mt-5 border-t pt-5", featured ? "border-white/15" : "border-sand-200")}>
                  <p className={cn("text-xs font-semibold uppercase tracking-[0.14em]", featured ? "text-white/60" : "text-navy-400")}>
                    {m.oneOff}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-relaxed">{plan.qr}</p>
                  <p className={cn("mt-2 text-sm leading-relaxed", featured ? "text-white/75" : "text-navy-600")}>
                    {plan.install}
                  </p>
                </div>

                <Button size="lg" className="mt-8" variant="cta" asChild>
                  <Link href={href}>{plan.cta}</Link>
                </Button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
