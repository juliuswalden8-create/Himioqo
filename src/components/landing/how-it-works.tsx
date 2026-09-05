import { CheckCircle2, QrCode, ScanLine, Shield } from "lucide-react";
import type { Dictionary } from "@/i18n/messages";

const icons = [ScanLine, QrCode, Shield, CheckCircle2];

export function HowItWorks({ dict }: { dict: Dictionary }) {
  const m = dict.marketing.journey;

  return (
    <section id="sa-fungerar-det" className="scroll-mt-[5.75rem] py-14 lg:py-16">
      <div className="container-marketing">
        <h2 className="max-w-xl font-display text-3xl font-semibold text-ocean sm:text-4xl">
          {m.title}
        </h2>
        <div className="relative mt-12">
          <div
            aria-hidden
            className="pointer-events-none absolute left-[12%] right-[12%] top-8 hidden h-px bg-sand-200 md:block"
          />
          <ol className="grid gap-5 md:grid-cols-4">
            {m.steps.map((step, index) => {
              const Icon = icons[index] ?? QrCode;
              return (
                <li key={step.title} className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sage">
                    <Icon className="h-6 w-6 text-ocean" strokeWidth={1.6} aria-hidden />
                  </div>
                  <p className="mt-4 text-xs font-semibold tracking-[0.16em] text-ocean">
                    0{index + 1}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-ocean">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-600">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
