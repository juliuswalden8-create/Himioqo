"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useAudience } from "@/components/landing/audience";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/messages";
import { cn } from "@/lib/utils";

export function Pricing({ dict }: { dict: Dictionary }) {
  const { audience } = useAudience();
  const m = dict.marketing.pricing;
  const plans = [
    { key: "private" as const, plan: m.private, href: "/register?segment=private" },
    { key: "company" as const, plan: m.company, href: "#demo" },
  ];

  return (
    <section id="priser" className="py-20 lg:py-24">
      <div className="container-marketing">
        <h2 className="max-w-xl font-display text-3xl font-semibold text-ocean sm:text-4xl">
          {m.title}
        </h2>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {plans.map(({ key, plan, href }) => {
            const featured = audience === key;
            return (
              <article
                key={key}
                className={cn(
                  "rounded-[1.75rem] border p-8 shadow-soft transition",
                  featured
                    ? "border-ocean bg-ocean text-white"
                    : "border-sand-200 bg-white",
                )}
              >
                <h3 className="font-display text-2xl font-semibold">{plan.name}</h3>
                <p className={cn("mt-2 text-sm", featured ? "text-white/75" : "text-navy-600")}>
                  {plan.blurb}
                </p>
                <p className="mt-6 font-display text-xl font-semibold">{plan.price}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-sm">
                      <Check
                        className={cn("mt-0.5 h-4 w-4 shrink-0", featured ? "text-terracotta-soft" : "text-terracotta")}
                        aria-hidden
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  className="mt-8"
                  variant="cta"
                  asChild
                >
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
