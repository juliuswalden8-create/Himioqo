"use client";

import { useAudience } from "@/components/landing/audience";
import type { Dictionary } from "@/i18n/messages";

export function PrivateBenefits({ dict }: { dict: Dictionary }) {
  const { audience } = useAudience();
  const m = dict.marketing.privateSection;

  return (
    <section
      id="fordelar"
      hidden={audience !== "private"}
      aria-hidden={audience !== "private"}
      className={`scroll-mt-[5.75rem] bg-sage/70 py-14 lg:py-16 ${audience !== "private" ? "hidden" : ""}`}
    >
      <div className="container-marketing">
        <h2 className="max-w-xl font-display text-3xl font-semibold text-ocean sm:text-4xl">
          {m.title}
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {m.benefits.map((item) => (
            <li
              key={item.title}
              className="rounded-3xl border border-sand-200 bg-white p-6 shadow-soft"
            >
              <h3 className="font-display text-lg font-semibold text-ocean">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">{item.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-sand-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy-400">
              {m.withoutTitle}
            </p>
            <p className="mt-3 text-base text-navy-700">{m.withoutText}</p>
          </div>
          <div className="rounded-3xl bg-ocean p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta-soft">
              {m.withTitle}
            </p>
            <p className="mt-3 text-base">{m.withText}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
