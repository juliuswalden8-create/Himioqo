import { cn } from "@/lib/utils";
import type { RatioTone } from "@/lib/ops-metrics";

const TONE_CLASS: Record<RatioTone, string> = {
  empty: "text-navy-300",
  neutral: "text-ocean",
  good: "text-green-600",
  watch: "text-status-waiting",
  alert: "text-status-urgent",
};

export function ProgressRing({
  percent,
  label,
  countLabel,
  emptyLabel,
  href,
  tone,
  size = 132,
}: {
  percent: number | null;
  label: string;
  countLabel: string;
  emptyLabel: string;
  href: string;
  tone: RatioTone;
  size?: number;
}) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = percent === null ? 0 : Math.min(100, Math.max(0, percent));
  const dash = (progress / 100) * circumference;
  const display = percent === null ? "–" : `${percent} %`;
  const described = percent === null ? emptyLabel : `${label}. ${countLabel}. ${display}`;

  return (
    <a
      href={href}
      className="flex flex-col items-center rounded-2xl px-3 py-4 text-center outline-offset-4 transition-colors hover:bg-canvas/80 focus-visible:ring-2 focus-visible:ring-terracotta"
      aria-label={described}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={cn("motion-safe:animate-[fade-in_400ms_ease-out]", TONE_CLASS[tone])}
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-navy-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="motion-reduce:transition-none motion-safe:transition-[stroke-dasharray] motion-safe:duration-700"
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-navy-800 text-[22px] font-semibold"
        >
          {display}
        </text>
      </svg>
      <p className="mt-3 text-sm font-semibold text-navy-800">{label}</p>
      <p className="mt-1 text-sm text-navy-600">{percent === null ? emptyLabel : countLabel}</p>
    </a>
  );
}
