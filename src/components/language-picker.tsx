"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fieldControlClass } from "@/components/ui/field-styles";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/i18n/messages";
import {
  allLanguages,
  languageByCode,
  PINNED_LOCALES,
  type LanguageOption,
} from "@/lib/i18n/languages";
import { cn } from "@/lib/utils";

const RECENT_KEY = "homioqo.recentLocales";

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function writeRecent(code: string) {
  const next = [code, ...readRecent().filter((item) => item !== code)].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function LanguagePicker({
  name = "locale",
  value,
  onChange,
  dict,
  compact = false,
  appearance,
}: {
  name?: string;
  value: string;
  onChange: (code: string) => void;
  dict: Dictionary;
  compact?: boolean;
  appearance?: "field" | "compact" | "header" | "header-dark";
}) {
  const look = appearance ?? (compact ? "compact" : "field");
  const isHeader = look === "header" || look === "header-dark";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const languages = useMemo(() => (open ? allLanguages() : []), [open]);
  const current = languageByCode(value || "sv");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return languages;
    return languages.filter(
      (item) =>
        item.native.toLowerCase().includes(q) ||
        item.english.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.region?.toLowerCase().includes(q) ?? false),
    );
  }, [languages, query]);

  const pinned = PINNED_LOCALES.map((code) => languages.find((item) => item.code === code)!).filter(Boolean);
  const recentItems = recent
    .filter((code) => !PINNED_LOCALES.includes(code as (typeof PINNED_LOCALES)[number]))
    .map((code) => languages.find((item) => item.code === code))
    .filter(Boolean) as LanguageOption[];
  const rest = filtered.filter(
    (item) =>
      !PINNED_LOCALES.includes(item.code as (typeof PINNED_LOCALES)[number]) &&
      !recent.includes(item.code),
  );

  function select(code: string) {
    writeRecent(code);
    setRecent(readRecent());
    onChange(code);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className={isHeader ? "inline-flex" : undefined}>
      <input type="hidden" name={name} value={value} />
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setRecent(readRecent());
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              fieldControlClass,
              "flex items-center justify-between text-left",
              look === "compact" &&
                "h-9 w-9 min-w-9 justify-center px-0 shadow-none sm:h-14 sm:w-auto sm:min-w-[8.5rem] sm:justify-between sm:gap-2 sm:px-4",
              look === "header" &&
                "h-auto w-auto min-w-0 justify-center gap-1.5 rounded-none border-0 bg-transparent px-2 py-2 font-medium shadow-none hover:bg-navy-800/5 hover:shadow-none",
              look === "header-dark" &&
                "h-auto w-auto min-w-0 justify-center gap-1.5 rounded-none border-0 bg-transparent px-2 py-2 font-medium text-ivory shadow-none hover:bg-white/10 hover:shadow-none",
            )}
            aria-label={dict.nav.language}
          >
            <span className="flex min-w-0 items-center gap-1.5 truncate">
              {look === "compact" ? (
                <Globe className="h-4 w-4 shrink-0 text-navy-700 sm:hidden" />
              ) : null}
              {isHeader ? (
                <Globe className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
              ) : null}
              <span
                suppressHydrationWarning
                className={cn("truncate", look === "compact" && "hidden sm:inline")}
              >
                {isHeader ? (
                  <span className="hidden sm:inline">{dict.nav.language}</span>
                ) : (
                  <>
                    {current.native}
                    {look === "field" ? (
                      <span suppressHydrationWarning className="ml-1 text-muted-foreground">
                        ({current.english})
                      </span>
                    ) : null}
                  </>
                )}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-ocean transition-transform duration-200",
                open && look === "field" && "rotate-180",
                look === "compact" && "hidden sm:block",
                look === "header" && "hidden",
                look === "header-dark" && "hidden",
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className={cn("p-2", look === "field" ? "w-[min(100vw-2rem,28rem)]" : "w-80")}>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={dict.nav.searchLanguage}
            autoComplete="off"
            className="mb-2 h-10"
          />
          <div className="max-h-72 overflow-y-auto">
            {!query && recentItems.length ? (
              <Group title={dict.nav.recent} items={recentItems} current={value} onSelect={select} />
            ) : null}
            {!query ? (
              <Group title={dict.nav.common} items={pinned} current={value} onSelect={select} />
            ) : null}
            <Group
              title={query ? dict.nav.all : dict.nav.all}
              items={query ? filtered : rest}
              current={value}
              onSelect={select}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Group({
  title,
  items,
  current,
  onSelect,
}: {
  title: string;
  items: LanguageOption[];
  current: string;
  onSelect: (code: string) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="mb-2">
      <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul>
        {items.map((item) => (
          <li key={item.code}>
            <button
              type="button"
              onClick={() => onSelect(item.code)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-navy-50"
            >
              <span suppressHydrationWarning>
                <span className="font-medium">{item.native}</span>
                <span className="ml-1.5 text-muted-foreground">{item.english}</span>
                {item.region ? (
                  <span className="ml-1 text-xs text-muted-foreground">· {item.region}</span>
                ) : null}
              </span>
              {current === item.code ? <Check className="h-4 w-4" /> : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
