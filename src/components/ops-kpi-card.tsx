import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function OpsKpiCard({
  href,
  value,
  label,
  help,
  icon: Icon,
  tone = "neutral",
}: {
  href: string;
  value: number;
  label: string;
  help: string;
  icon: LucideIcon;
  tone?: "neutral" | "alert" | "watch" | "good";
}) {
  const toneClass =
    tone === "alert"
      ? "text-status-urgent bg-status-urgent/10"
      : tone === "watch"
        ? "text-status-waiting bg-status-waiting/10"
        : tone === "good"
          ? "text-green-700 bg-green-50"
          : "text-ocean bg-navy-50";

  return (
    <Link
      href={href}
      className="flex h-full min-h-[8.5rem] flex-col rounded-2xl border border-border bg-white p-4 shadow-soft outline-offset-2 transition-colors hover:border-ocean/30"
    >
      <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl", toneClass)}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <p className="mt-3 text-3xl font-semibold tabular-nums text-navy-800">{value}</p>
      <p className="mt-1 text-sm font-medium text-navy-800">{label}</p>
      <p className="mt-1 text-sm text-navy-600">{help}</p>
    </Link>
  );
}
