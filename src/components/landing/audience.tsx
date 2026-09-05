"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { Dictionary } from "@/i18n/messages";
import type { AccountType } from "@/lib/types";
import { cn } from "@/lib/utils";

type AudienceContextValue = {
  audience: AccountType;
  setAudience: (next: AccountType, opts?: { scrollTo?: string }) => void;
};

const AudienceContext = createContext<AudienceContextValue | null>(null);

export function AudienceProvider({
  initial,
  children,
}: {
  initial: AccountType;
  children: ReactNode;
}) {
  const [audience, setAudienceState] = useState<AccountType>(initial);

  const setAudience = useCallback((next: AccountType, opts?: { scrollTo?: string }) => {
    setAudienceState(next);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("segment", next);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    if (opts?.scrollTo) {
      const id = opts.scrollTo;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      }, 40);
    }
  }, []);

  return (
    <AudienceContext.Provider value={{ audience, setAudience }}>
      {children}
    </AudienceContext.Provider>
  );
}

export function useAudience() {
  const ctx = useContext(AudienceContext);
  if (!ctx) throw new Error("useAudience must be used within AudienceProvider");
  return ctx;
}

export function AudienceToggle({
  dict,
  className,
}: {
  dict: Dictionary;
  className?: string;
}) {
  const { audience, setAudience } = useAudience();
  const m = dict.marketing.audience;
  const options: { id: AccountType; label: string }[] = [
    { id: "private", label: m.private },
    { id: "company", label: m.company },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={m.label}
      className={cn(
        "inline-flex rounded-full border border-sand-200 bg-white/80 p-1 shadow-soft backdrop-blur",
        className,
      )}
    >
      {options.map((option) => {
        const selected = audience === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setAudience(option.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              selected
                ? "bg-terracotta text-white shadow-soft"
                : "text-navy-500 hover:text-ocean",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
