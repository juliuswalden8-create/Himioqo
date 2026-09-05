import { Globe, Languages, Lock, RefreshCw, Smartphone, Sparkles } from "lucide-react";
import type { Dictionary } from "@/i18n/messages";

const icons = [Smartphone, RefreshCw, Globe, Languages, Lock, Sparkles];

export function TrustPoints({ dict }: { dict: Dictionary }) {
  const m = dict.marketing.trust;

  return (
    <section className="bg-white py-14 lg:py-16">
      <div className="container-marketing">
        <h2 className="max-w-xl font-display text-3xl font-semibold text-ocean sm:text-4xl">
          {m.title}
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {m.points.map((point, index) => {
            const Icon = icons[index] ?? Lock;
            return (
              <li
                key={point.title}
                className="rounded-3xl border border-sand-200 bg-sage/80 p-5"
              >
                <Icon className="h-5 w-5 text-ocean" strokeWidth={1.6} aria-hidden />
                <h3 className="mt-3 font-display text-lg font-semibold text-ocean">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-600">{point.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
