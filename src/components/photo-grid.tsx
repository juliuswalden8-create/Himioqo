"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function PhotoGrid({
  items,
  emptyLabel,
  onRemove,
  className,
}: {
  items: { id?: string; url: string; caption?: string }[];
  emptyLabel?: string;
  onRemove?: (index: number) => void;
  className?: string;
}) {
  if (!items.length) {
    if (!emptyLabel) return null;
    return (
      <p className="text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}>
      {items.map((item, index) => (
        <li key={item.id ?? item.url} className="group relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.url}
            alt={item.caption ?? "Bild"}
            className="h-32 w-full rounded-xl object-cover sm:h-36"
          />
          {item.caption ? (
            <p className="mt-1.5 truncate text-xs text-muted-foreground">{item.caption}</p>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-navy-800 shadow-soft"
              aria-label="Ta bort bild"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
