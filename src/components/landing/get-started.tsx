"use client";

import Link from "next/link";
import { useAudience } from "@/components/landing/audience";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/messages";

export function GetStarted({ dict }: { dict: Dictionary }) {
  const { audience } = useAudience();
  const m = dict.marketing.start;
  const href = audience === "company" ? "#demo" : "/register?segment=private";

  return (
    <section className="py-20 lg:py-24">
      <div className="container-marketing">
        <h2 className="max-w-xl font-display text-3xl font-semibold text-ocean sm:text-4xl">
          {m.title}
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {m.steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-3xl border border-sand-200 bg-white p-6 shadow-soft"
            >
              <p className="font-display text-3xl font-semibold text-ocean">0{index + 1}</p>
              <h3 className="mt-4 font-display text-xl font-semibold text-ocean">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">{step.text}</p>
            </li>
          ))}
        </ol>
        <Button size="lg" variant="cta" className="mt-10" asChild>
          <Link href={href}>{m.cta}</Link>
        </Button>
      </div>
    </section>
  );
}
