import { expect, test } from "@playwright/test";
import { PRIVATE_ROUTE_SAMPLES, X_ROBOTS_TAG_VALUE } from "../src/lib/security/robots";

const HTML_SAMPLES = ["/qr_solsidan", "/qr_solsidan/info", "/g/qr_solsidan", "/g/qr_solsidan/info"] as const;

test.describe("private routes must not be indexable", () => {
  test("every private sample sends X-Robots-Tag", async ({ request }) => {
    for (const path of PRIVATE_ROUTE_SAMPLES) {
      const response = await request.get(path, { maxRedirects: 0, failOnStatusCode: false });
      expect(response.headers()["x-robots-tag"], path).toBe(X_ROBOTS_TAG_VALUE);
    }
  });

  test("QR and guest pages keep a generic title and robots meta", async ({ request }) => {
    for (const path of HTML_SAMPLES) {
      const response = await request.get(path);
      const html = await response.text();
      expect(html, path).toMatch(/<title>[^<]*(gästguide|guest guide|guía del huésped)/i);
      expect(html, path).toMatch(/name="robots" content="[^"]*noindex/i);
      expect(html, path).toMatch(/name="robots" content="[^"]*nofollow/i);
      const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "";
      expect(title.toLowerCase()).not.toMatch(/solsidan|exempelvägen|bergström|norrbo|villa sol/);
    }
  });

  test("marketing homepage stays indexable", async ({ request }) => {
    const response = await request.get("/");
    expect(response.headers()["x-robots-tag"] ?? "").not.toContain("noindex");
    const html = await response.text();
    expect(html).toMatch(/name="robots" content="index, follow"/i);
  });
});
