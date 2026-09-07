import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AppListRow({
  href,
  children,
  badges,
  actions,
  className,
  fullRow = false,
  rowLabel,
}: {
  href: string;
  children: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  className?: string;
  fullRow?: boolean;
  rowLabel?: string;
}) {
  return (
    <li className={cn("relative border-b border-border last:border-0", className)}>
      {fullRow ? (
        <Link
          href={href}
          className="absolute inset-0 z-0 rounded-xl"
          aria-label={rowLabel}
        />
      ) : null}
      <div className="relative z-10 flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
        {fullRow ? (
          <div className="flex min-w-0 flex-1 items-center gap-3 px-1 py-1">
            <div className="min-w-0 flex-1">{children}</div>
            {badges ? (
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{badges}</div>
            ) : null}
            <ChevronRight className="h-4 w-4 shrink-0 text-navy-300" aria-hidden />
          </div>
        ) : (
          <Link
            href={href}
            className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl outline-offset-2 -mx-1 px-1 py-1 hover:bg-canvas/80"
          >
            <div className="min-w-0 flex-1">{children}</div>
            {badges ? (
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{badges}</div>
            ) : null}
            <ChevronRight
              className="h-4 w-4 shrink-0 text-navy-300 transition-colors group-hover:text-navy-600"
              aria-hidden
            />
          </Link>
        )}
        {actions ? (
          <div className="flex flex-wrap gap-2 sm:max-w-[18rem] sm:justify-end">{actions}</div>
        ) : null}
      </div>
    </li>
  );
}
