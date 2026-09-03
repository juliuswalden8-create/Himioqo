"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/messages";
import type { CleaningStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CleaningStatusBadge({
  status,
  dict,
}: {
  status: CleaningStatus;
  dict: Dictionary;
}) {
  const ready = status === "completed" || status === "approved";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        ready && "bg-status-done/10 text-status-done",
        status === "in_progress" && "bg-status-progress/15 text-status-progress",
        status === "accepted" && "bg-status-assigned/10 text-status-assigned",
        status === "scheduled" && "bg-navy-50 text-navy-600",
        status === "returned" && "bg-status-waiting/10 text-status-waiting",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {dict.cleaning.status[status]}
    </span>
  );
}

export function ReadyBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-status-done/10 px-2.5 py-1 text-[11px] font-medium text-status-done">
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function CopyLinkButton({
  url,
  dict,
}: {
  url: string;
  dict: Dictionary;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="text-sm font-medium text-navy-700 underline"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }}
    >
      {copied ? dict.cleaning.copied : dict.cleaning.copyLink}
    </button>
  );
}
