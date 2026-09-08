import type { Metadata } from "next";

/** Google-facing robots value for every private or token-gated page. */
export const X_ROBOTS_TAG_VALUE = "noindex, nofollow, noarchive, nosnippet";

export const NOINDEX_ROBOTS = {
  index: false,
  follow: false,
  noarchive: true,
  nosnippet: true,
  noimageindex: true,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
    noarchive: true,
    nosnippet: true,
  },
} satisfies Metadata["robots"];

export const INDEXABLE_ROBOTS = {
  index: true,
  follow: true,
} satisfies Metadata["robots"];

/** Marketing URLs that may appear in sitemap.xml. */
export const INDEXABLE_SITEMAP_PATHS = ["/", "/privacy", "/terms", "/demo"] as const;

const INDEXABLE_EXACT = new Set<string>([
  ...INDEXABLE_SITEMAP_PATHS,
  "/sitemap.xml",
  "/robots.txt",
]);

const INDEXABLE_ASSET_PREFIXES = ["/brand/", "/landing/"] as const;

/**
 * Prefixes search engines must not crawl. Includes both Homioqo's real
 * private routes and the names Google (or a future rewrite) might use.
 */
export const REQUIRED_ROBOTS_DISALLOW = [
  "/qr_",
  "/property/",
  "/properties/",
  "/dashboard/",
  "/issues/",
  "/admin/",
  "/portal/",
  "/g/",
  "/qr/",
  "/c/",
  "/t/",
  "/o/",
  "/w/",
  "/r/",
  "/app/",
  "/access/",
  "/verify/",
  "/reset/",
  "/onboarding",
  "/api/",
  "/login",
  "/register",
  "/forgot-password",
  "/logout",
] as const;

/** Representative private URLs. Tests fail if any of these become indexable. */
export const PRIVATE_ROUTE_SAMPLES = [
  "/g/qr_solsidan",
  "/g/qr_solsidan/info",
  "/g/qr_solsidan/area",
  "/g/qr_solsidan/report",
  "/qr_solsidan",
  "/qr_solsidan/info",
  "/qr/token",
  "/c/token",
  "/w/token",
  "/o/token",
  "/t/token",
  "/r/token",
  "/app",
  "/app/cases",
  "/app/cases/new",
  "/app/properties",
  "/app/cleaning",
  "/app/settings",
  "/login",
  "/register",
  "/onboarding",
  "/access/invite/token",
  "/access/login/token",
  "/verify/token",
  "/reset/token",
  "/forgot-password",
  "/logout",
  "/api/qr/token",
  "/dashboard/overview",
  "/property/1",
  "/properties/1",
  "/issues/1",
  "/admin",
  "/portal/guest",
] as const;

/**
 * Next.js `headers()` sources that must send X-Robots-Tag. Includes Homioqo's
 * real private prefixes and names Google already indexed or might invent.
 */
export const PRIVATE_HEADER_SOURCES = [
  "/g/:path*",
  "/qr/:path*",
  "/qr_:token",
  "/qr_:token/:path*",
  "/c/:path*",
  "/t/:path*",
  "/o/:path*",
  "/w/:path*",
  "/r/:path*",
  "/app",
  "/app/:path*",
  "/access/:path*",
  "/verify/:path*",
  "/reset/:path*",
  "/onboarding",
  "/onboarding/:path*",
  "/api/:path*",
  "/login",
  "/login/:path*",
  "/register",
  "/register/:path*",
  "/forgot-password",
  "/forgot-password/:path*",
  "/logout",
  "/property",
  "/property/:path*",
  "/properties",
  "/properties/:path*",
  "/dashboard",
  "/dashboard/:path*",
  "/issues",
  "/issues/:path*",
  "/admin",
  "/admin/:path*",
  "/portal",
  "/portal/:path*",
] as const;

/**
 * Lightweight Next.js header-source matcher so tests fail if a private URL
 * is missing from `next.config.ts`.
 */
export function headerSourceCoversPath(source: string, pathname: string) {
  const path = normalizePathname(pathname);
  const pattern = source
    .replace(/\/:([A-Za-z0-9_]+)\*/g, "(?:/.*)?")
    .replace(/:([A-Za-z0-9_]+)/g, "[^/]+");
  return new RegExp(`^${pattern}$`).test(path);
}

export function privateHeaderSourceFor(pathname: string) {
  return PRIVATE_HEADER_SOURCES.find((source) => headerSourceCoversPath(source, pathname));
}

export function normalizePathname(pathname: string) {
  const path = pathname.split("?")[0] ?? pathname;
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

export function isIndexablePath(pathname: string) {
  const path = normalizePathname(pathname);
  if (INDEXABLE_EXACT.has(path)) return true;
  return INDEXABLE_ASSET_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function robotsTagForPath(pathname: string) {
  return isIndexablePath(pathname) ? null : X_ROBOTS_TAG_VALUE;
}

/**
 * Legacy indexed URLs like /qr_solsidan (no /g/ prefix). Must not match
 * printable signs at /qr/[token].
 */
export function isBareQrAliasPath(pathname: string) {
  return /^\/qr_[A-Za-z0-9_-]+(?:\/.*)?$/.test(normalizePathname(pathname));
}

export function rewriteBareQrPath(pathname: string) {
  if (!isBareQrAliasPath(pathname)) return pathname;
  return `/g${normalizePathname(pathname)}`;
}
