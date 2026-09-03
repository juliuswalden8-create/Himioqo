import Link from "next/link";
import { cn } from "@/lib/utils";

export type LogoTone = "brand" | "onDark" | "black" | "white";

const fills: Record<LogoTone, { word: string; mark: string; pin: string }> = {
  brand: { word: "#16383F", mark: "#16383F", pin: "#B64A32" },
  onDark: { word: "#F7F4ED", mark: "#F7F4ED", pin: "#B64A32" },
  black: { word: "#1D292B", mark: "#1D292B", pin: "#1D292B" },
  white: { word: "#FFFFFF", mark: "#FFFFFF", pin: "#FFFFFF" },
};

/** Letter q: circular counter with a pin-shaped descender. */
export function LogoQ({
  className,
  tone = "brand",
  title,
}: {
  className?: string;
  tone?: LogoTone;
  title?: string;
}) {
  const { mark, pin } = fills[tone];
  return (
    <svg
      viewBox="0 0 22 32"
      className={className}
      fill="none"
      aria-hidden={!title}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        fill={mark}
        fillRule="evenodd"
        d="M11 1.6c5.3 0 9.6 4.3 9.6 9.6S16.3 20.8 11 20.8 1.4 16.5 1.4 11.2 5.7 1.6 11 1.6Zm0 6.1a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
      />
      <path
        fill={pin}
        d="M16.7 18.4c.7 1.5 1.25 3.55 1.4 5.85-.95-.25-2.35-.9-3.65-2.35-.55.95-1.15 1.6-1.4 1.8.25-2.05.95-4.45 2.05-5.95.45.2 1 .4 1.6.65Z"
      />
    </svg>
  );
}

/** Standalone q / map-pin mark, readable at 16px. */
export function LogoMark({
  className,
  tone = "brand",
  title = "Homioqo",
}: {
  className?: string;
  tone?: LogoTone;
  title?: string;
}) {
  const { mark, pin } = fills[tone];
  const hole = tone === "brand" || tone === "black" ? "#F7F4ED" : "#16383F";
  const inner = tone === "white" || tone === "black" ? mark : pin;
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" role="img" aria-label={title}>
      <title>{title}</title>
      <path
        fill={mark}
        d="M16 3.2c5.2 0 9.4 3.7 9.4 8.3 0 6.2-9.4 15.3-9.4 15.3S6.6 17.7 6.6 11.5c0-4.6 4.2-8.3 9.4-8.3Z"
      />
      <circle cx="16" cy="12" r="3.6" fill={hole} />
      <circle cx="16" cy="12" r="1.45" fill={inner} />
    </svg>
  );
}

export function LogoWordmark({
  className,
  tone = "brand",
}: {
  className?: string;
  tone?: LogoTone;
}) {
  const { word } = fills[tone];
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-semibold lowercase tracking-[-0.045em]",
        className,
      )}
      style={{ color: word }}
    >
      <span>homio</span>
      <LogoQ tone={tone} className="mx-px h-[1.18em] w-[0.82em] translate-y-[0.22em]" />
      <span>o</span>
    </span>
  );
}

export function Wordmark({
  className,
  tone = "brand",
}: {
  className?: string;
  tone?: LogoTone;
}) {
  return (
    <Link href="/" className={cn("inline-flex items-center", className)} aria-label="Homioqo">
      <LogoWordmark tone={tone} className="text-[1.35rem] leading-none" />
    </Link>
  );
}

export function Logo({
  className,
  compact = false,
  href = "/",
}: {
  className?: string;
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center", className)} aria-label="Homioqo">
      {compact ? (
        <span className="inline-flex h-8 w-8 overflow-hidden rounded-lg bg-ocean">
          <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
            <rect width="32" height="32" rx="8" fill="#16383F" />
            <path
              fill="#F7F4ED"
              d="M16 6.2c4.15 0 7.5 2.95 7.5 6.6 0 4.95-7.5 12.2-7.5 12.2S8.5 17.75 8.5 12.8c0-3.65 3.35-6.6 7.5-6.6Z"
            />
            <circle cx="16" cy="13" r="2.85" fill="#16383F" />
            <circle cx="16" cy="13" r="1.15" fill="#B64A32" />
          </svg>
        </span>
      ) : (
        <LogoWordmark className="text-[1.2rem] leading-none" />
      )}
    </Link>
  );
}
