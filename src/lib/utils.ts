import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/**
 * Public QR, contractor, cleaner and owner links are guarded only by these
 * tokens, so weak randomness would make them guessable. Fail loudly instead of
 * degrading to Math.random. 18 random bytes rendered as hex.
 */
export const ACCESS_TOKEN_BODY_LENGTH = 36;

export function createToken(prefix = "pc"): string {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("A secure random source is required to create access tokens.");
  }
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${body}`;
}

export function isSecureAccessToken(token: string) {
  return new RegExp(`^[a-z]{2,8}_[0-9a-f]{${ACCESS_TOKEN_BODY_LENGTH}}$`).test(token.trim());
}

/**
 * Guessable tokens (seed fixtures like qr_strand14) never resolve in production.
 * The public product demo is handled separately and only returns fake example data.
 */
export function publicAccessTokenAllowed(token: string) {
  const value = token.trim();
  if (!value) return false;
  if (isSecureAccessToken(value)) return true;
  return process.env.NODE_ENV !== "production";
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export function daysAgo(days: number, hours = 10, minutes = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export function todayAt(hour: number, minute = 0): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function daysFromNow(days: number, hours = 10, minutes = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export function formatPhoneForWa(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

export function whatsappUrl(phone: string, text: string): string {
  return `https://wa.me/${formatPhoneForWa(phone)}?text=${encodeURIComponent(text)}`;
}

export function mailtoUrl(email: string, subject: string, body?: string): string {
  const params = new URLSearchParams({ subject });
  if (body) params.set("body", body);
  return `mailto:${email}?${params.toString()}`;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  return /^[+]?[\d\s()-]{7,20}$/.test(value.trim());
}

export function isValidContact(value: string): boolean {
  return isValidEmail(value) || isValidPhone(value);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const PRODUCTION_FALLBACK = "https://homioqo.vercel.app";

function configuredSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    ""
  );
}

/** Public origin for canonical URLs, Open Graph, sitemap, QR links and email. */
export function siteOrigin(): string {
  const explicit = configuredSiteUrl();
  if (process.env.VERCEL_ENV === "production") {
    return explicit && !explicit.includes("localhost") ? explicit : PRODUCTION_FALLBACK;
  }
  if (explicit) return explicit;
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/\/$/, "");
  if (vercelProd) return `https://${vercelProd}`;
  return "http://localhost:3000";
}

export function appUrl(path = ""): string {
  const base = siteOrigin();
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
