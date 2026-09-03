"use client";

import { useRouter } from "next/navigation";
import { LanguagePicker } from "@/components/language-picker";
import type { Dictionary } from "@/i18n/messages";
import { setLocaleAction } from "@/lib/locale-actions";

export function GuestLocale({
  locale,
  dict,
}: {
  locale: string;
  dict: Dictionary;
}) {
  const router = useRouter();
  return (
    <LanguagePicker
      compact
      dict={dict}
      value={locale}
      onChange={async (code) => {
        await setLocaleAction(code);
        router.refresh();
      }}
    />
  );
}
