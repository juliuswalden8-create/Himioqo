"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/messages";

export function QrPanel({
  guestUrl,
  downloadUrl,
  previewUrl,
  dict,
}: {
  guestUrl: string;
  downloadUrl: string;
  previewUrl: string;
  dict: Dictionary;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-3">
      <p className="overflow-x-auto rounded-xl bg-canvas px-3 py-2 font-mono text-xs text-navy-700">
        {guestUrl}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="cta">
          <a href={downloadUrl} download>
            {dict.homes.download}
          </a>
        </Button>
        <Button asChild variant="secondary">
          <Link href={previewUrl}>{dict.homes.preview}</Link>
        </Button>
        <Button asChild variant="secondary">
          <a href={guestUrl} target="_blank" rel="noreferrer">
            {dict.homes.openGuide}
          </a>
        </Button>
        <button
          type="button"
          className="text-sm font-medium text-navy-700 underline"
          onClick={async () => {
            await navigator.clipboard.writeText(guestUrl);
            setCopied(true);
          }}
        >
          {copied ? dict.caseDetail.copied : dict.homes.copyGuestLink}
        </button>
      </div>
    </div>
  );
}
