import {
  Bike,
  Car,
  Coffee,
  Dumbbell,
  FerrisWheel,
  Flag,
  HeartPulse,
  Moon,
  Sailboat,
  ShoppingBag,
  ShoppingCart,
  Soup,
  Sun,
  CarTaxiFront,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { LocalizedText, PlaceCategory } from "@/lib/types";
import { PLACE_CATEGORIES } from "@/lib/types";

export const PLACE_CATEGORY_ICONS: Record<PlaceCategory, LucideIcon> = {
  restaurants: UtensilsCrossed,
  cafes: Coffee,
  groceries: ShoppingCart,
  taxi: CarTaxiFront,
  boats: Sailboat,
  carrental: Car,
  beaches: Sun,
  golf: Flag,
  activities: FerrisWheel,
  shopping: ShoppingBag,
  nightlife: Moon,
  health: HeartPulse,
  kids: Bike,
  delivery: Soup,
  gym: Dumbbell,
};

export const DEFAULT_CATEGORY_ORDER: PlaceCategory[] = [...PLACE_CATEGORIES];

export function pickText(
  map: LocalizedText | undefined,
  locale: string,
  fallback = "",
): string {
  if (!map) return fallback;
  const base = locale.split("-")[0] ?? locale;
  return (
    map[locale] ||
    map[base] ||
    map.en ||
    map.sv ||
    map.es ||
    Object.values(map).find((value) => Boolean(value)) ||
    fallback
  );
}

export function formatKm(km: number, locale: string) {
  const value = km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
}

export function haversineKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function osmEmbedUrl(lat: number, lng: number, delta = 0.025) {
  const minLng = lng - delta;
  const minLat = lat - delta;
  const maxLng = lng + delta;
  const maxLat = lat + delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export function mapsDirectionsUrl(
  destination: { lat: number; lng: number; address?: string },
  origin?: { lat: number; lng: number },
) {
  const dest =
    destination.lat && destination.lng
      ? `${destination.lat},${destination.lng}`
      : destination.address ?? "";
  const params = new URLSearchParams({ api: "1", destination: dest });
  if (origin) params.set("origin", `${origin.lat},${origin.lng}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function isSponsored(sponsored: boolean, kind: string) {
  return sponsored || kind === "sponsored" || kind === "paid";
}
