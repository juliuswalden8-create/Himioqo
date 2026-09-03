"use client";

import Link from "next/link";
import { Bell, Building2, Camera, Check } from "lucide-react";
import { LogoWordmark } from "@/components/brand/logo";
import { useAudience } from "@/components/landing/audience";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/messages";

export function BusinessDashboard({ dict }: { dict: Dictionary }) {
  const { audience } = useAudience();
  const m = dict.marketing.businessSection;

  const rows = [
    {
      home: m.mock.propertyA,
      issue: m.mock.caseA,
      priority: m.mock.priorityHigh,
      status: m.mock.statusNew,
      tone: "new" as const,
      person: m.mock.personA,
    },
    {
      home: m.mock.propertyB,
      issue: m.mock.caseB,
      priority: m.mock.priorityMedium,
      status: m.mock.statusProgress,
      tone: "progress" as const,
      person: m.mock.personB,
    },
    {
      home: m.mock.propertyC,
      issue: m.mock.caseC,
      priority: m.mock.priorityLow,
      status: m.mock.statusDone,
      tone: "done" as const,
      person: m.mock.personA,
    },
  ];

  return (
    <section
      id="foretag"
      hidden={audience !== "company"}
      aria-hidden={audience !== "company"}
      className={`bg-sage/70 py-20 lg:py-24 ${audience !== "company" ? "hidden" : ""}`}
    >
      <div className="container-marketing">
        <h2 className="max-w-xl font-display text-3xl font-semibold text-ocean sm:text-4xl">
          {m.title}
        </h2>

        <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-sand-200 bg-white shadow-lift">
          <div className="grid lg:grid-cols-[200px_1fr]">
            <aside className="hidden border-r border-sand-200 bg-canvas p-5 lg:block">
              <LogoWordmark className="text-sm" />
              <ul className="mt-6 space-y-1 text-sm">
                {[m.mock.homes, m.mock.cases, m.mock.notices, m.mock.stats].map((item, index) => (
                  <li
                    key={item}
                    className={`rounded-xl px-3 py-2 ${index === 1 ? "bg-ocean text-white" : "text-navy-700"}`}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </aside>
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold text-ocean">{m.mock.cases}</p>
                  <p className="text-sm text-navy-500">3 {m.mock.open}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-3 py-1 text-xs font-medium text-navy-700">
                  <Bell className="h-3.5 w-3.5" aria-hidden />
                  {m.mock.noticeA}
                </span>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-navy-400">
                    <tr>
                      <th className="pb-3 font-medium">{m.mock.homes}</th>
                      <th className="pb-3 font-medium">{m.mock.cases}</th>
                      <th className="pb-3 font-medium">{m.mock.priority}</th>
                      <th className="pb-3 font-medium">{m.mock.photos}</th>
                      <th className="pb-3 font-medium">{m.mock.assignee}</th>
                      <th className="pb-3 font-medium">{m.mock.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.issue} className="border-t border-sand-100">
                        <td className="py-3 font-medium text-ocean">{row.home}</td>
                        <td className="py-3 text-navy-700">{row.issue}</td>
                        <td className="py-3 text-navy-700">{row.priority}</td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1 text-navy-600">
                            <Camera className="h-3.5 w-3.5" aria-hidden />
                            <span className="sr-only">{m.mock.photos}</span>
                          </span>
                        </td>
                        <td className="py-3 text-navy-700">{row.person}</td>
                        <td className="py-3">
                          <StatusChip tone={row.tone} label={row.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-canvas p-4">
                  <Building2 className="h-4 w-4 text-navy-500" aria-hidden />
                  <p className="mt-2 text-2xl font-semibold text-ocean">12</p>
                  <p className="text-xs text-navy-500">{m.mock.homes}</p>
                </div>
                <div className="rounded-2xl bg-canvas p-4">
                  <p className="text-2xl font-semibold text-ocean">4</p>
                  <p className="text-xs text-navy-500">{m.mock.history}</p>
                </div>
                <div className="rounded-2xl bg-ocean p-4 text-white">
                  <p className="text-sm font-medium">{m.mock.update}</p>
                  <p className="mt-1 text-xs text-white/70">{m.mock.noticeB}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {m.benefits.map((item) => (
            <li key={item.title} className="rounded-3xl border border-sand-200 bg-white p-6 shadow-soft">
              <Check className="h-4 w-4 text-terracotta" aria-hidden />
              <h3 className="mt-3 font-display text-lg font-semibold text-ocean">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">{item.text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <Button size="lg" variant="cta" asChild>
            <Link href="#demo">{m.cta}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function StatusChip({ tone, label }: { tone: "new" | "progress" | "done"; label: string }) {
  const classes =
    tone === "done"
      ? "bg-green-50 text-green-700"
      : tone === "progress"
        ? "bg-sand-100 text-navy-700"
        : "bg-sage text-ocean";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
