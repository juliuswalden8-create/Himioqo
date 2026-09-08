import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import nextConfig from "../next.config";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { en, es, sv } from "@/i18n/messages";
import { middleware } from "@/middleware";
import {
  createProperty,
  getGuestGuide,
  getPropertyByToken,
  resetStore,
} from "@/lib/data/store";
import { PUBLIC_DEMO_TOKEN } from "@/lib/public-demo";
import {
  INDEXABLE_SITEMAP_PATHS,
  PRIVATE_HEADER_SOURCES,
  PRIVATE_ROUTE_SAMPLES,
  REQUIRED_ROBOTS_DISALLOW,
  X_ROBOTS_TAG_VALUE,
  headerSourceCoversPath,
  isBareQrAliasPath,
  isIndexablePath,
  privateHeaderSourceFor,
  robotsTagForPath,
  rewriteBareQrPath,
} from "@/lib/security/robots";
import { createToken, isSecureAccessToken, publicAccessTokenAllowed } from "@/lib/utils";

const ORG = "org_bergstrom";

const INDEXABLE_SAMPLES = ["/", "/privacy", "/terms", "/demo"] as const;

const LIVE_BASE = process.env.HOMIOQO_LIVE_URL?.replace(/\/$/, "");

/** Independent copy so removing a prefix from robots.ts fails this test. */
const MUST_DISALLOW = [
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

beforeEach(() => {
  resetStore();
  vi.unstubAllEnvs();
});

describe("indexable vs private paths", () => {
  it("only allows marketing pages to be indexed", () => {
    for (const path of INDEXABLE_SAMPLES) {
      expect(isIndexablePath(path)).toBe(true);
      expect(robotsTagForPath(path)).toBeNull();
    }
    expect(isIndexablePath("/privacy/")).toBe(true);
    expect(isIndexablePath("/landing/hero-guest-scan.jpg")).toBe(true);
  });

  it("fails if a private route would be indexed", () => {
    for (const path of PRIVATE_ROUTE_SAMPLES) {
      expect(isIndexablePath(path), path).toBe(false);
      expect(robotsTagForPath(path), path).toBe(X_ROBOTS_TAG_VALUE);
    }
  });

  it("rewrites legacy /qr_* URLs onto the guest guide without matching /qr/ print pages", () => {
    expect(isBareQrAliasPath("/qr_solsidan")).toBe(true);
    expect(isBareQrAliasPath("/qr_solsidan/info")).toBe(true);
    expect(rewriteBareQrPath("/qr_solsidan/info")).toBe("/g/qr_solsidan/info");
    expect(isBareQrAliasPath("/qr/token")).toBe(false);
    expect(isBareQrAliasPath("/g/qr_solsidan")).toBe(false);
  });
});

describe("X-Robots-Tag on private routes", () => {
  it("covers Google's indexed /qr_* aliases with a Next header source", () => {
    expect(headerSourceCoversPath("/qr_:token", "/qr_solsidan")).toBe(true);
    expect(headerSourceCoversPath("/qr_:token/:path*", "/qr_solsidan/info")).toBe(true);
    expect(headerSourceCoversPath("/qr/:path*", "/qr_solsidan")).toBe(false);
  });

  it("fails if any private sample is missing from next.config header sources", async () => {
    const headers = nextConfig.headers ? await nextConfig.headers() : [];
    const configured = new Set(
      headers.filter((entry) => entry.headers.some((header) => header.key === "X-Robots-Tag")).map((entry) => entry.source),
    );
    for (const source of PRIVATE_HEADER_SOURCES) {
      expect(configured, source).toContain(source);
    }
    for (const path of PRIVATE_ROUTE_SAMPLES) {
      expect(privateHeaderSourceFor(path), path).toBeTruthy();
    }
  });

  it("fails if middleware omits X-Robots-Tag on a private route", async () => {
    for (const path of PRIVATE_ROUTE_SAMPLES) {
      const request = new NextRequest(new URL(path, "http://localhost:3000"));
      const response = await middleware(request);
      expect(response.headers.get("X-Robots-Tag"), path).toBe(X_ROBOTS_TAG_VALUE);
    }
    const home = await middleware(new NextRequest(new URL("http://localhost:3000/")));
    expect(home.headers.get("X-Robots-Tag")).toBeNull();
  });
});

describe.skipIf(!LIVE_BASE)("deployed noindex headers", () => {
  it("sends X-Robots-Tag on private URLs of the live site", async () => {
    const paths = ["/qr_solsidan", "/qr_solsidan/info", "/g/qr_solsidan", "/g/qr_solsidan/info", "/app", "/login"];
    for (const path of paths) {
      const response = await fetch(`${LIVE_BASE}${path}`, { redirect: "manual" });
      expect(response.headers.get("x-robots-tag"), path).toBe(X_ROBOTS_TAG_VALUE);
    }
    const home = await fetch(`${LIVE_BASE}/`);
    expect(home.headers.get("x-robots-tag") ?? "").not.toContain("noindex");
    const robotsTxt = await fetch(`${LIVE_BASE}/robots.txt`);
    const body = await robotsTxt.text();
    for (const prefix of ["/qr_", "/g/", "/app/", "/property/", "/portal/"]) {
      expect(body, prefix).toContain(`Disallow: ${prefix}`);
    }
  });
});

beforeEach(() => {
  resetStore();
  vi.unstubAllEnvs();
});

describe("indexable vs private paths", () => {
  it("only allows marketing pages to be indexed", () => {
    for (const path of INDEXABLE_SAMPLES) {
      expect(isIndexablePath(path)).toBe(true);
      expect(robotsTagForPath(path)).toBeNull();
    }
    expect(isIndexablePath("/privacy/")).toBe(true);
    expect(isIndexablePath("/landing/hero-guest-scan.jpg")).toBe(true);
  });

  it("fails if a private route would be indexed", () => {
    for (const path of PRIVATE_ROUTE_SAMPLES) {
      expect(isIndexablePath(path), path).toBe(false);
      expect(robotsTagForPath(path), path).toBe(X_ROBOTS_TAG_VALUE);
    }
  });

  it("rewrites legacy /qr_* URLs onto the guest guide without matching /qr/ print pages", () => {
    expect(isBareQrAliasPath("/qr_solsidan")).toBe(true);
    expect(isBareQrAliasPath("/qr_solsidan/info")).toBe(true);
    expect(rewriteBareQrPath("/qr_solsidan/info")).toBe("/g/qr_solsidan/info");
    expect(isBareQrAliasPath("/qr/token")).toBe(false);
    expect(isBareQrAliasPath("/g/qr_solsidan")).toBe(false);
  });
});

describe("robots.txt", () => {
  it("disallows every private prefix search engines must not crawl", () => {
    const body = robots();
    const disallow = Array.isArray(body.rules) ? body.rules[0]?.disallow : body.rules.disallow;
    expect(disallow).toEqual(expect.arrayContaining([...REQUIRED_ROBOTS_DISALLOW]));
    for (const prefix of MUST_DISALLOW) {
      expect(REQUIRED_ROBOTS_DISALLOW, prefix).toContain(prefix);
      expect(disallow, prefix).toContain(prefix);
    }
  });
});

describe("sitemap.xml", () => {
  it("only lists public marketing URLs", () => {
    const paths = sitemap().map((entry) => {
      const url = new URL(entry.url);
      return url.pathname === "/" ? "/" : url.pathname.replace(/\/$/, "");
    });
    expect(paths.sort()).toEqual([...INDEXABLE_SITEMAP_PATHS].sort());
    expect(paths).not.toContain("/login");
    expect(paths).not.toContain("/register");
    expect(paths.some((path) => path.startsWith("/g/") || path.startsWith("/app/") || path.startsWith("/qr"))).toBe(
      false,
    );
  });
});

describe("guest metadata must stay generic", () => {
  it("does not put property, address or customer names in Google titles", () => {
    for (const dict of [sv, en, es]) {
      expect(dict.guide.metaTitle).toMatch(/gästguide|guest guide|guía del huésped/i);
      expect(dict.qrPrint.metaTitle).toMatch(/QR/i);
      const blob = `${dict.guide.metaTitle} ${dict.qrPrint.metaTitle} ${dict.guide.noApp}`;
      expect(blob).not.toMatch(/Villa Sol|Solsidan|Exempelvägen|Bergström|Norrbo/i);
    }
  });
});

describe("access tokens", () => {
  it("issues unguessable tokens for new properties", () => {
    const tokens = new Set(Array.from({ length: 20 }, () => createToken("qr")));
    expect(tokens.size).toBe(20);
    for (const token of tokens) {
      expect(isSecureAccessToken(token)).toBe(true);
      expect(token).toMatch(/^qr_[0-9a-f]{36}$/);
    }
    expect(isSecureAccessToken("qr_solsidan")).toBe(false);
    expect(isSecureAccessToken("qr_strand14")).toBe(false);
    expect(publicAccessTokenAllowed("")).toBe(false);

    const home = createProperty(ORG, {
      name: "Token test home",
      address: "Testgatan 1",
      city: "Malmö",
      country: "Sverige",
      countryCode: "SE",
      imageUrl: "",
      type: "apartment",
      sqm: 40,
      rooms: 2,
      tenantName: "",
      tenantEmail: "",
      tenantPhone: "",
      leaseStart: new Date().toISOString(),
      leaseEnd: new Date().toISOString(),
      lastInspection: new Date().toISOString(),
    });
    expect(isSecureAccessToken(home.reportToken)).toBe(true);
    expect(getGuestGuide(home.reportToken)?.guide.wifiPassword ?? "").toBe("");
  });

  it("does not serve real Wi-Fi or door codes without a token, and demo data stays fake", () => {
    expect(getGuestGuide("")).toBeUndefined();
    expect(getGuestGuide("qr")).toBeUndefined();
    expect(getPropertyByToken(PUBLIC_DEMO_TOKEN)).toBeUndefined();
    const demo = getGuestGuide(PUBLIC_DEMO_TOKEN);
    expect(demo?.guide.wifiName).toBe("EXAMPLE-WIFI");
    expect(demo?.guide.wifiPassword).toBe("example-pass-000");
  });

  it("rejects guessable customer tokens in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(publicAccessTokenAllowed("qr_strand14")).toBe(false);
    expect(getPropertyByToken("qr_strand14")).toBeUndefined();
    expect(getGuestGuide("qr_strand14")).toBeUndefined();
    expect(getGuestGuide(PUBLIC_DEMO_TOKEN)?.guide.wifiPassword).toBe("example-pass-000");
  });
});
