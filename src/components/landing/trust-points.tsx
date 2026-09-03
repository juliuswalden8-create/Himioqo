import { Globe, Languages, Lock, RefreshCw, Smartphone, Sparkles } from "lucide-react";
import type { Dictionary } from "@/i18n/messages";

const icons = [Smartphone, RefreshCw, Globe, Languages, Lock, Sparkles];

export function TrustPoints({ dict }: { dict: Dictionary }) {
  const m = dict.marketing.trust;

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="container-marketing">
        <h2 className="max-w-xl font-display text-3xl font-semibold text-ocean sm:text-4xl">
          {m.title}
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {m.points.map((point, index) => {
            const Icon = icons[index] ?? Lock;
            return (
              <li
                key={point.title}
                className="rounded-3xl border border-sand-200 bg-sage/80 p-6"
              >
                <Icon className="h-5 w-5 text-ocean" strokeWidth={1.6} aria-hidden />
                <h3 className="mt-4 font-display text-lg font-semibold text-ocean">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-600">{point.text}</p>
              </li>
            );
          })}
        </ul>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Placeholder title={m.logosTitle} body={m.logosSoon} />
          <Placeholder title={m.reviewsTitle} body={m.reviewsSoon} />
          <Placeholder title={m.casesTitle} body={m.casesSoon} />
        </div>
      </div>
    </section>
  );
}

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-sand-300 bg-ivory p-6">
      <p className="text-sm font-semibold text-ocean">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-navy-500">{body}</p>
    </div>
  );
}
