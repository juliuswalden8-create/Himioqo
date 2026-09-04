"use client";

import Image from "next/image";
import Link from "next/link";
import { AudienceToggle, useAudience } from "@/components/landing/audience";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/messages";

export function Hero({ dict }: { dict: Dictionary }) {
  const { audience } = useAudience();
  const m = dict.marketing;
  const copy = audience === "company" ? m.hero.company : m.hero.private;
  const primaryHref = audience === "company" ? "#demo" : "/register?segment=private";
  const secondaryHref = audience === "company" ? "#funktioner" : "#sa-fungerar-det";

  return (
    <section className="relative overflow-hidden">
      <div className="container-marketing grid items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-16">
        <div>
          <AudienceToggle dict={dict} />
          <h1 className="mt-6 max-w-xl font-display font-semibold text-ocean">
            {copy.titleBefore}<span className="text-terracotta">{copy.titleAccent}</span>{copy.titleAfter}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-navy-500">
            {copy.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="cta" asChild>
              <Link href={primaryHref}>{copy.primary}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href={secondaryHref}>{copy.secondary}</a>
            </Button>
          </div>
          <p className="mt-5 text-sm font-medium text-navy-500">{copy.trust}</p>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] sm:aspect-[5/4] lg:aspect-auto lg:min-h-[36rem]">
          <Image
            src="/landing/hero-guest-scan.jpg"
            alt={m.hero.imageAlt}
            fill
            priority
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="photo-brand object-cover object-[70%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ocean/25 via-transparent to-transparent" />
        </div>
      </div>
    </section>
  );
}
