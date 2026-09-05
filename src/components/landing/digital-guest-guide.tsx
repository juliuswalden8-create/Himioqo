"use client";

import { useState } from "react";
import {
  AlertCircle,
  Car,
  Compass,
  Home,
  Languages,
  MapPin,
  Phone,
  Sailboat,
  Sparkles,
  Tv,
  UtensilsCrossed,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { PhoneFrame } from "@/components/landing/phone-frame";
import { PRODUCT_DEMO_HREF } from "@/components/landing/links";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/messages";
import { cn } from "@/lib/utils";

const featureIcons = [
  Home,
  Wifi,
  MapPin,
  Tv,
  AlertCircle,
  Phone,
  Sparkles,
  UtensilsCrossed,
  Car,
  Sailboat,
  Compass,
  Languages,
] as const;

export function DigitalGuestGuide({ dict }: { dict: Dictionary }) {
  const m = dict.marketing.guide;
  const [active, setActive] = useState(0);
  const feature = m.features[active] ?? m.features[0];
  const Icon = featureIcons[active] ?? Home;

  return (
    <section id="funktioner" className="scroll-mt-[5.75rem] bg-sage/60 py-14 lg:py-16">
      <div className="container-marketing">
        <h2 className="max-w-xl font-display text-3xl font-semibold text-ocean sm:text-4xl">
          {m.title}
        </h2>
        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1fr_280px]">
          <ul className="grid gap-2 sm:grid-cols-2">
            {m.features.map((item, index) => {
              const ItemIcon = featureIcons[index] ?? Home;
              const selected = index === active;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setActive(index)}
                    aria-pressed={selected}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition",
                      selected
                        ? "border-ocean bg-ocean text-white shadow-soft"
                        : "border-transparent bg-white hover:border-sage hover:bg-ivory",
                    )}
                  >
                    <ItemIcon
                      className={cn("h-4 w-4 shrink-0", selected ? "text-terracotta-soft" : "text-ocean")}
                      strokeWidth={1.7}
                      aria-hidden
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex justify-center lg:sticky lg:top-28">
            <PhoneFrame label={feature.screenTitle}>
              <div className="flex h-full flex-col px-4 pb-5 pt-8">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-navy-400">
                  {dict.marketing.phone.villa}
                </p>
                <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-sage">
                  <Icon className="h-5 w-5 text-ocean" aria-hidden />
                </div>
                <p className="mt-4 font-display text-xl font-semibold text-ocean">
                  {feature.screenTitle}
                </p>
                <ul className="mt-4 space-y-2">
                  {feature.lines.map((line) => (
                    <li
                      key={line}
                      className="rounded-2xl border border-sand-200 bg-white px-3 py-3 text-sm text-navy-700 shadow-soft"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </PhoneFrame>
          </div>
        </div>
        <div className="mt-8">
          <Button size="lg" variant="outline" asChild>
            <Link href={PRODUCT_DEMO_HREF}>{dict.marketing.cta.demo}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
