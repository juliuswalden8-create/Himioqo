"use client";

import { LanguagePicker } from "@/components/language-picker";
import type { Dictionary } from "@/i18n/messages";
import { setLocaleAction } from "@/lib/locale-actions";

export function SettingsLanguage({
  value,
  dict,
}: {
  value: string;
  dict: Dictionary;
}) {
  return (
    <LanguagePicker
      value={value}
      dict={dict}
      onChange={(code) => {
        void setLocaleAction(code);
      }}
    />
  );
}
