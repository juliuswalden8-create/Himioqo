"use client";

import type { ReactNode } from "react";
import { recordGuideClickAction } from "@/lib/guide-actions";
import type { GuideEventKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TrackedLink({
  href,
  token,
  placeId,
  kind,
  className,
  children,
}: {
  href: string;
  token: string;
  placeId: string;
  kind: Exclude<GuideEventKind, "scan">;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(className)}
      onClick={() => {
        const data = new FormData();
        data.set("token", token);
        data.set("placeId", placeId);
        data.set("kind", kind);
        void recordGuideClickAction(data);
      }}
    >
      {children}
    </a>
  );
}
