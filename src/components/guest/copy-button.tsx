"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Dictionary } from "@/i18n/messages";
import { recordGuideClickAction } from "@/lib/guide-actions";

export function CopyButton({
  value,
  dict,
  token,
  trackKind,
}: {
  value: string;
  dict: Dictionary;
  token?: string;
  trackKind?: "click_wifi";
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1.5 text-xs font-medium text-navy-800"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        if (token && trackKind) {
          const data = new FormData();
          data.set("token", token);
          data.set("kind", trackKind);
          void recordGuideClickAction(data);
        }
        window.setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? dict.guide.copied : dict.guide.copy}
    </button>
  );
}
