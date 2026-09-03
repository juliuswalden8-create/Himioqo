import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PhoneFrame({
  children,
  className,
  label,
  size = "md",
}: {
  children: ReactNode;
  className?: string;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "relative mx-auto shrink-0 bg-ocean shadow-lift",
        size === "sm"
          ? "w-[168px] rounded-[1.7rem] p-[7px] sm:w-[200px] lg:w-[232px] lg:rounded-[2.15rem] lg:p-[9px]"
          : "w-[232px] rounded-[2.15rem] p-[9px]",
        className,
      )}
    >
      <p className="sr-only">{label}</p>
      <div
        aria-hidden
        className={cn(
          "absolute left-1/2 z-10 -translate-x-1/2 rounded-full bg-ocean-hover",
          size === "sm"
            ? "top-1.5 h-4 w-14 sm:top-2 lg:h-5 lg:w-[72px]"
            : "top-2 h-5 w-[72px]",
        )}
      />
      <div
        className={cn(
          "overflow-hidden bg-canvas",
          size === "sm"
            ? "h-[332px] rounded-[1.35rem] sm:h-[400px] lg:h-[460px] lg:rounded-[1.7rem]"
            : "h-[460px] rounded-[1.7rem]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
