"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function SafePhoto({
  src,
  alt,
  fallbackLabel,
  className,
}: {
  src: string;
  alt: string;
  fallbackLabel: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(!src);

  if (failed) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 bg-sage/80 text-muted-foreground",
          className,
        )}
      >
        <ImageOff className="h-4 w-4" aria-hidden />
        <span className="px-2 text-center text-[11px] leading-tight">{fallbackLabel}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
