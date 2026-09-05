"use client";

import Image from "next/image";
import Link from "next/link";
import { useAudience } from "@/components/landing/audience";
import { BOOK_DEMO_HREF, PRODUCT_DEMO_HREF, startPilotHref } from "@/components/landing/links";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/messages";

export function FinalCta({ dict }: { dict: Dictionary }) {
  const { audience } = useAudience();
  const m = dict.marketing.cta;
  const primaryHref = audience === "company" ? BOOK_DEMO_HREF : startPilotHref("private");
  const primaryLabel = audience === "company" ? m.book : m.start;

  return (
    <section className="relative overflow-hidden py-20 lg:py-24">
      <Image
        src="/landing/cta-villa.jpg"
        alt={m.imageAlt}
        fill
        sizes="100vw"
        className="photo-brand object-cover"
      />
      <div className="absolute inset-0 bg-ocean/72" />
      <div className="container-marketing relative max-w-3xl text-center">
        <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">{m.title}</h2>
        <p className="mt-4 text-base leading-relaxed text-white/85">{m.text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" variant="cta" asChild>
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/50 bg-transparent text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href={PRODUCT_DEMO_HREF}>{m.demo}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
