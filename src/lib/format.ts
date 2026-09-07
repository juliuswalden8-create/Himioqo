import { format, formatDistanceToNow, isThisYear, parseISO } from "date-fns";
import type { Locale } from "date-fns";
import { de, enGB, es, fr, nl, sv } from "date-fns/locale";

/**
 * Date locales for the languages the product ships with. Anything else falls
 * back to British English rather than Swedish, so an unknown locale never
 * shows a language the reader did not ask for.
 */
const DATE_LOCALES: Record<string, Locale> = { sv, en: enGB, es, de, fr, nl };

function dateLocale(code?: string): Locale {
  if (!code) return sv;
  return DATE_LOCALES[code.slice(0, 2).toLowerCase()] ?? enGB;
}

export function parseDate(value: string) {
  return parseISO(value);
}

export function formatDate(value: string, locale?: string) {
  return format(parseISO(value), "d MMM yyyy", { locale: dateLocale(locale) });
}

export function formatDateLong(value: string, locale?: string) {
  return format(parseISO(value), "d MMMM yyyy", { locale: dateLocale(locale) });
}

export function formatDateTime(value: string, locale?: string) {
  return format(parseISO(value), "d MMM yyyy, HH:mm", { locale: dateLocale(locale) });
}

export function formatTime(value: string, locale?: string) {
  return format(parseISO(value), "HH:mm", { locale: dateLocale(locale) });
}

export function formatRelative(value: string, locale?: string) {
  return formatDistanceToNow(parseISO(value), {
    addSuffix: true,
    locale: dateLocale(locale),
  });
}

export function formatOpenDuration(value: string, locale?: string) {
  return formatDistanceToNow(parseISO(value), {
    addSuffix: false,
    locale: dateLocale(locale),
  });
}

export function formatMonthLabel(isoMonth: string, locale?: string) {
  const date = parseISO(`${isoMonth}-01`);
  const loc = dateLocale(locale);
  if (isThisYear(date)) return format(date, "MMM", { locale: loc });
  return format(date, "MMM yy", { locale: loc });
}

/** `template` is a dictionary string containing a {name} placeholder. */
export function greeting(
  fullName: string,
  templates: { morning: string; afternoon: string; evening: string },
) {
  const first = fullName.split(" ")[0] ?? fullName;
  const hour = new Date().getHours();
  const template =
    hour < 10 ? templates.morning : hour < 18 ? templates.afternoon : templates.evening;
  return template.replace("{name}", first);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
