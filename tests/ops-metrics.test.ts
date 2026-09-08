import { beforeEach, describe, expect, it } from "vitest";
import { periodDelta, ratioFromCounts, ratioTone } from "@/lib/ops-metrics";
import { getPublicDemoGuide, isPublicProductDemo } from "@/lib/public-demo";
import {
  getGuestGuide,
  getPropertyByToken,
  getResultMetrics,
  listCases,
  registerTrialAccount,
  resetStore,
  submitReport,
} from "@/lib/data/store";

beforeEach(() => {
  resetStore();
});

describe("ratio helpers", () => {
  it("never returns 100 percent when the denominator is zero", () => {
    expect(ratioFromCounts(0, 0)).toEqual({ completed: 0, total: 0, percent: null });
    expect(ratioFromCounts(4, 0)).toEqual({ completed: 0, total: 0, percent: null });
    expect(ratioFromCounts(0, 5).percent).toBe(0);
    expect(ratioFromCounts(4, 5).percent).toBe(80);
    expect(ratioFromCounts(5, 5).percent).toBe(100);
  });

  it("hides deltas unless both periods have volume", () => {
    expect(periodDelta(0, 0)).toBeNull();
    expect(periodDelta(12, 0)).toBeNull();
    expect(periodDelta(0, 8)).toBeNull();
    expect(periodDelta(12, 10)).toBe(20);
    expect(periodDelta(8, 10)).toBe(-20);
  });

  it("maps tones without relying on colour alone", () => {
    expect(ratioTone(null)).toBe("empty");
    expect(ratioTone(80)).toBe("good");
    expect(ratioTone(50)).toBe("watch");
    expect(ratioTone(20)).toBe("alert");
  });
});

describe("public product demo", () => {
  it("serves Villa Sol without attaching it to a customer workspace", () => {
    expect(isPublicProductDemo("qr_solsidan")).toBe(true);
    expect(getPropertyByToken("qr_solsidan")).toBeUndefined();
    const guide = getGuestGuide("qr_solsidan") ?? getPublicDemoGuide();
    expect(guide.property.name).toBe("Villa Sol");
    expect(guide.guide.wifiName).toBe("EXAMPLE-WIFI");
    expect(guide.guide.wifiPassword).toBe("example-pass-000");
    expect(guide.org?.supportEmail).toBe("vard@example.com");
    expect(JSON.stringify(guide)).not.toContain("org_bergstrom");
    expect(JSON.stringify(guide)).not.toContain("anna@homioqo.se");
  });

  it("discards demo reports instead of creating cases", () => {
    const before = listCases("org_bergstrom").length;
    expect(() =>
      submitReport({
        propertyToken: "qr_solsidan",
        category: "other",
        priority: "soon",
        title: "Demo report",
        description: "Should not persist",
        discoveredAt: new Date().toISOString(),
        stillOngoing: true,
        reporterName: "Guest",
        reporterPhone: "000-000 00 00",
        reporterEmail: "guest@example.com",
        photos: [],
      }),
    ).toThrow("demo_readonly");
    expect(listCases("org_bergstrom").length).toBe(before);
  });
});

describe("customer isolation", () => {
  it("keeps two registered workspaces apart and starts them empty", () => {
    const a = registerTrialAccount({
      firstName: "Ada",
      lastName: "Host",
      email: "ada.iso@example.com",
      phone: "+46701110001",
      phoneCountry: "SE",
      country: "SE",
      locale: "sv",
      unitBand: "1-5",
      marketingConsent: false,
      organizationName: "Ada Förvaltning",
      accountType: "company",
    });
    const b = registerTrialAccount({
      firstName: "Bo",
      lastName: "Host",
      email: "bo.iso@example.com",
      phone: "+46701110002",
      phoneCountry: "SE",
      country: "SE",
      locale: "sv",
      unitBand: "1-5",
      marketingConsent: false,
      organizationName: "Bo Förvaltning",
      accountType: "company",
    });
    expect(a.organizationId).not.toBe(b.organizationId);
    expect(getResultMetrics(a.organizationId).homesReady).toEqual({
      completed: 0,
      total: 0,
      percent: null,
    });
    expect(listCases(a.organizationId)).toEqual([]);
    expect(listCases(b.organizationId)).toEqual([]);
  });
});
