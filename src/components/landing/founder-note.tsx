import { interpolate } from "@/i18n/interpolate";
import type { Dictionary } from "@/i18n/messages";
import { FOUNDER_FIRST_NAME } from "@/lib/constants";

export function FounderNote({ dict }: { dict: Dictionary }) {
  const m = dict.marketing.founder;
  const name = { name: FOUNDER_FIRST_NAME };

  return (
    <section className="bg-ivory py-16 lg:py-20" aria-labelledby="founder-heading">
      <div className="container-marketing max-w-2xl">
        <p className="text-sm font-medium text-navy-500">{m.role}</p>
        <h2 id="founder-heading" className="mt-2 font-display text-3xl font-semibold text-ocean">
          {interpolate(m.heading, name)}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-navy-600">{interpolate(m.text, name)}</p>
      </div>
    </section>
  );
}
