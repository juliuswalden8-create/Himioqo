"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/brand/logo";
import { useAudience } from "@/components/landing/audience";
import { LanguagePicker } from "@/components/language-picker";
import type { Dictionary } from "@/i18n/messages";
import { SUPPORT_EMAIL } from "@/lib/constants";
import { setLocaleAction } from "@/lib/locale-actions";

export function MarketingFooter({ dict, locale }: { dict: Dictionary; locale: string }) {
  const router = useRouter();
  const { setAudience } = useAudience();
  const m = dict.marketing.footer;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ocean py-14 text-ivory">
      <div className="container-marketing grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <Wordmark tone="onDark" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ivory/75">{m.blurb}</p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-4 inline-block text-sm font-medium text-ivory hover:text-terracotta-soft"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
        <div>
          <p className="text-sm font-semibold text-ivory">{m.product}</p>
          <ul className="mt-3 space-y-2 text-sm text-ivory/75">
            <li>
              <a href="#sa-fungerar-det" className="hover:text-ivory">
                {dict.marketing.nav.how}
              </a>
            </li>
            <li>
              <button
                type="button"
                className="hover:text-ivory"
                onClick={() => setAudience("private", { scrollTo: "fordelar" })}
              >
                {m.forPrivate}
              </button>
            </li>
            <li>
              <button
                type="button"
                className="hover:text-ivory"
                onClick={() => setAudience("company", { scrollTo: "foretag" })}
              >
                {m.forCompany}
              </button>
            </li>
            <li>
              <a href="#priser" className="hover:text-ivory">
                {m.pricing}
              </a>
            </li>
            <li>
              <Link href="/demo" className="hover:text-ivory">
                {m.demo}
              </Link>
            </li>
            <li>
              <a href="#faq" className="hover:text-ivory">
                {m.faq}
              </a>
            </li>
            <li>
              <a href="#demo" className="hover:text-ivory">
                {m.contact}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ivory">{m.language}</p>
          <div className="mt-3">
            <LanguagePicker
              dict={dict}
              value={locale}
              appearance="compact"
              onChange={async (code) => {
                await setLocaleAction(code);
                router.refresh();
              }}
            />
          </div>
          <p className="mt-6 text-sm font-semibold text-ivory">{m.social}</p>
          <div className="mt-3 flex gap-2">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-ivory/70"
              title={m.instagram}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.7" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
              </svg>
              <span className="sr-only">{m.instagram}</span>
            </span>
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-ivory/70"
              title={m.linkedin}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M6.5 9H4V20h2.5V9ZM5.25 4A1.5 1.5 0 1 0 5.26 7a1.5 1.5 0 0 0 0-3ZM20 20h-2.5v-5.6c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94V20H11V9h2.4v1.5h.03c.33-.63 1.15-1.64 2.37-1.64 2.54 0 3.2 1.67 3.2 3.84V20Z" />
              </svg>
              <span className="sr-only">{m.linkedin}</span>
            </span>
          </div>
          <ul className="mt-6 space-y-2 text-sm text-ivory/75">
            <li>
              <Link href="/privacy" className="hover:text-ivory">
                {m.privacy}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-ivory">
                {m.terms}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="container-marketing mt-10 text-xs text-ivory/50">
        © {year} {m.copyright}
      </p>
    </footer>
  );
}
