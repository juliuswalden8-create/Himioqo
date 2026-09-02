import { format, formatDistanceToNow, isThisYear, parseISO } from "date-fns";
import { sv } from "date-fns/locale";

export function parseDate(value: string) {
  return parseISO(value);
}

export function formatDate(value: string) {
  const date = parseISO(value);
  return format(date, "d MMM yyyy", { locale: sv });
}

export function formatDateLong(value: string) {
  const date = parseISO(value);
  return format(date, "d MMMM yyyy", { locale: sv });
}

export function formatDateTime(value: string) {
  const date = parseISO(value);
  return format(date, "d MMM yyyy, HH:mm", { locale: sv });
}

export function formatTime(value: string) {
  return format(parseISO(value), "HH:mm", { locale: sv });
}

export function formatRelative(value: string) {
  return formatDistanceToNow(parseISO(value), { addSuffix: true, locale: sv });
}

export function formatMonthLabel(isoMonth: string) {
  const date = parseISO(`${isoMonth}-01`);
  if (isThisYear(date)) return format(date, "MMM", { locale: sv });
  return format(date, "MMM yy", { locale: sv });
}

export function greeting(fullName: string) {
  const first = fullName.split(" ")[0] ?? fullName;
  const hour = new Date().getHours();
  if (hour < 10) return `God morgon, ${first}`;
  if (hour < 18) return `God eftermiddag, ${first}`;
  return `God kväll, ${first}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
