"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  Compass,
  Home,
  Sparkles,
  Wifi,
} from "lucide-react";
import { AudienceToggle, useAudience } from "@/components/landing/audience";
import { PhoneFrame } from "@/components/landing/phone-frame";
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
            src="/landing/hero-scan.jpg"
            alt={m.hero.imageAlt}
            fill
            priority
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="photo-brand object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ocean/45 via-transparent to-transparent" />
          <div className="absolute bottom-4 right-3 sm:bottom-6 sm:right-5">
            <HeroPhone dict={dict} />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroPhone({ dict }: { dict: Dictionary }) {
  const p = dict.marketing.phone;
  const items = [
    { icon: Wifi, label: p.wifi },
    { icon: Home, label: p.checkin },
    { icon: Sparkles, label: p.house },
    { icon: AlertCircle, label: p.report },
    { icon: Compass, label: p.area },
  ];

  return (
    <PhoneFrame label={dict.marketing.hero.phoneAlt} size="sm" className="shadow-lift">
      <div className="flex h-full flex-col px-4 pb-4 pt-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-navy-400">
          Homioqo
        </p>
        <p className="mt-1 font-display text-lg font-semibold text-ocean">{p.welcome}</p>
        <p className="mt-1 text-xs text-navy-500">{p.villa}</p>
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 shadow-soft"
            >
              <item.icon className="h-4 w-4 text-ocean" strokeWidth={1.7} aria-hidden />
              <span className="text-xs font-medium text-ocean">{item.label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto rounded-2xl bg-terracotta px-3 py-2.5 text-center text-xs font-medium text-white">
          {p.help}
        </div>
      </div>
    </PhoneFrame>
  );
}
