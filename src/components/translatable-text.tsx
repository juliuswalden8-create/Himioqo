"use client";

import { useState } from "react";

export function TranslatableText({
  text,
  originalText,
  showOriginalLabel,
  showTranslatedLabel,
}: {
  text: string;
  originalText?: string;
  showOriginalLabel: string;
  showTranslatedLabel: string;
}) {
  const [original, setOriginal] = useState(false);
  const hasOriginal = Boolean(originalText && originalText !== text);
  return (
    <div>
      <p className="text-sm leading-relaxed">{original ? originalText : text}</p>
      {hasOriginal ? (
        <button
          type="button"
          className="mt-1 text-xs font-medium text-navy-600 underline"
          onClick={() => setOriginal((value) => !value)}
        >
          {original ? showTranslatedLabel : showOriginalLabel}
        </button>
      ) : null}
    </div>
  );
}
