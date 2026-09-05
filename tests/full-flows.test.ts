import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  BOOK_DEMO_HREF,
  GUEST_GUIDE_DEMO_HREF,
  PRODUCT_DEMO_HREF,
  startPilotHref,
} from "@/components/landing/links";
import { en, es, sv } from "@/i18n/messages";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  FOUNDER_EMAIL,
  PRICE_MONTHLY_EUR,
  PRICE_SETUP_EUR,
  TEST_OTHER_HOST_EMAIL,
} from "@/lib/constants";
import {
  authenticate,
  consumePasswordResetToken,
  consumeVerificationToken,
  createPasswordResetToken,
  assignPlaceToProperty,
  createPlace,
  createProperty,
  getGuestGuide,
  getOrganization,
  getPropertyByToken,
  getPropertyGuide,
  listCases,
  listProperties,
  peekPasswordResetToken,
  registerTrialAccount,
  resetStore,
  revokeGuestLink,
  setProfilePassword,
  submitReport,
  updateCaseStatus,
  updateProperty,
  updatePropertyGuide,
} from "@/lib/data/store";
import { validatePilotLead } from "@/lib/pilot-schema";
import { parsePhotoPayload } from "@/lib/uploads";
import { siteOrigin } from "@/lib/utils";
import { encodeSignupTicket, ticketFromProfile } from "@/lib/signup-ticket";

const ORG = "org_bergstrom";
const OTHER = "org_norrbo";
const png =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function homeInput(name: string) {
  return {
    name,
    address: `${name} 1`,
    city: "Marbella",
    country: "España",
    countryCode: "ES",
    imageUrl: "",
    type: "apartment" as const,
    sqm: 55,
    rooms: 2,
    tenantName: "Gäst",
    tenantEmail: "",
    tenantPhone: "",
    leaseStart: new Date().toISOString(),
    leaseEnd: new Date().toISOString(),
    lastInspection: new Date().toISOString(),
  };
}

function leadForm(overrides: Record<string, string> = {}) {
  const data = new FormData();
  data.set("name", "Test Person");
  data.set("email", "test.person@example.com");
  data.set("phone", "+46701111111");
  data.set("accountType", "private");
  data.set("consent", "on");
  data.set("propertyCount", "1-5");
  data.set("message", "Vill testa Homioqo");
  data.set("locale", "sv");
  for (const [key, value] of Object.entries(overrides)) data.set(key, value);
  return data;
}

beforeEach(() => {
  resetStore();
});

describe("landing copy and CTAs", () => {
  it("keeps founder names, roles and prices in sv/en/es", () => {
    for (const dict of [sv, en, es]) {
      expect(dict.marketing.team.people.founder.name).toBe("John Julius Erik Walden");
      expect(dict.marketing.team.people.coFounder.name).toBe("Karl John Oliver Landen");
      expect(dict.marketing.pricing.private.afterPrice).toContain("14 €");
      expect(dict.marketing.pricing.company.afterPrice).toContain("14 €");
      expect(dict.marketing.pricing.private.qr).toContain("49 €");
      expect(dict.marketing.pricing.company.qr).toContain("49 €");
      expect(JSON.stringify(dict.marketing.trust)).not.toMatch(/logosSoon|reviewsSoon|casesSoon/);
    }
    expect(sv.marketing.team.people.founder.role).toBe("Grundare");
    expect(en.marketing.team.people.founder.role).toBe("Founder");
    expect(es.marketing.team.people.founder.role).toBe("Fundador");
    expect(sv.marketing.team.people.coFounder.role).toBe("Medgrundare");
    expect(en.marketing.team.people.coFounder.role).toBe("Co-founder");
    expect(es.marketing.team.people.coFounder.role).toBe("Cofundador");
    expect(PRICE_MONTHLY_EUR).toBe(14);
    expect(PRICE_SETUP_EUR).toBe(49);
  });

  it("does not show translation keys as visible marketing copy", () => {
    const blob = JSON.stringify({ sv: sv.marketing, en: en.marketing, es: es.marketing });
    expect(blob).not.toMatch(/marketing\.[a-zA-Z]/);
    expect(sv.marketing.hero.private.secondary).toBe("Testa en gästguide");
    expect(en.marketing.hero.private.secondary).toBe("Try a guest guide");
    expect(es.marketing.hero.private.secondary).toBe("Prueba una guía de huésped");
  });

  it("points CTAs at demo, register segment and contact form", () => {
    expect(PRODUCT_DEMO_HREF).toBe("/demo");
    expect(GUEST_GUIDE_DEMO_HREF).toBe("/g/qr_solsidan");
    expect(BOOK_DEMO_HREF).toBe("#demo");
    expect(startPilotHref("private")).toBe("/register?segment=private");
    expect(startPilotHref("company")).toBe("/register?segment=company");
  });
});

describe("site origin", () => {
  it("falls back to the Vercel URL in production when no custom domain is set", () => {
    const previous = process.env.VERCEL_ENV;
    const site = process.env.NEXT_PUBLIC_SITE_URL;
    const app = process.env.NEXT_PUBLIC_APP_URL;
    process.env.VERCEL_ENV = "production";
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(siteOrigin()).toBe("https://homioqo.vercel.app");
    process.env.NEXT_PUBLIC_SITE_URL = "https://example-homioqo.test";
    expect(siteOrigin()).toBe("https://example-homioqo.test");
    if (previous === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
    if (site === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = site;
    if (app === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = app;
  });
});

describe("contact form", () => {
  it("accepts a complete private lead and rejects missing consent or invalid email", () => {
    expect(validatePilotLead(leadForm()).ok).toBe(true);
    expect(validatePilotLead(leadForm({ consent: "" })).ok).toBe(false);
    expect(validatePilotLead(leadForm({ consent: "" })).error).toBe("consent");
    expect(validatePilotLead(leadForm({ email: "inte-mejl" })).error).toBe("email");
    expect(validatePilotLead(leadForm({ phone: "abc" })).error).toBe("phone");
    expect(validatePilotLead(leadForm({ phone: "" })).error).toBe("phone");
    expect(validatePilotLead(leadForm({ name: "" })).error).toBe("required");
  });

  it("requires a company name for company leads", () => {
    const missing = leadForm({ accountType: "company", company: "" });
    expect(validatePilotLead(missing).ok).toBe(false);
    const ok = leadForm({ accountType: "company", company: "Costa Rentals" });
    expect(validatePilotLead(ok).ok).toBe(true);
  });
});

describe("registration and accounts", () => {
  it("registers a private trial without billing fields", () => {
    const source = readFileSync("src/components/register-form.tsx", "utf8");
    expect(source).not.toMatch(/card|stripe|kortnummer|credit/i);
    const profile = registerTrialAccount({
      firstName: "Pia",
      lastName: "Privat",
      email: "pia.privat@example.com",
      phone: "+46702222222",
      phoneCountry: "SE",
      country: "SE",
      locale: "sv",
      unitBand: "1-5",
      marketingConsent: false,
      organizationName: "Pia hus",
      accountType: "private",
    });
    const org = getOrganization(profile.organizationId);
    expect(org?.accountType).toBe("private");
    expect(org?.plan).toBe("trial");
    expect(org?.billed).toBe(false);
  });

  it("registers a company trial and rejects a reused email", () => {
    registerTrialAccount({
      firstName: "Carlos",
      lastName: "Costa",
      email: "carlos.costa@example.com",
      phone: "+34600111222",
      phoneCountry: "ES",
      country: "ES",
      locale: "es",
      unitBand: "6-20",
      marketingConsent: false,
      organizationName: "Costa Rentals",
      accountType: "company",
    });
    expect(() =>
      registerTrialAccount({
        firstName: "Carlos",
        lastName: "Dos",
        email: "carlos.costa@example.com",
        phone: "+34600111223",
        phoneCountry: "ES",
        country: "ES",
        locale: "es",
        unitBand: "6-20",
        marketingConsent: false,
        organizationName: "Otro",
        accountType: "company",
      }),
    ).toThrow("exists");
  });

  it("verifies a test signup, enforces password length and logs in", () => {
    const actionSource = readFileSync("src/lib/signup-actions.ts", "utf8");
    expect(actionSource).toContain("if (password.length < 8) return { error: \"password\" }");
    const profile = registerTrialAccount({
      firstName: "Vera",
      lastName: "Verify",
      email: "vera.verify@example.com",
      phone: "+46703333333",
      phoneCountry: "SE",
      country: "SE",
      locale: "en",
      unitBand: "1-5",
      marketingConsent: false,
      organizationName: "Vera Stay",
      accountType: "private",
    });
    const org = getOrganization(profile.organizationId)!;
    const token = encodeSignupTicket(ticketFromProfile(profile, org));
    const verified = consumeVerificationToken(token);
    expect(verified?.emailVerifiedAt).toBeTruthy();
    setProfilePassword(verified!.id, "lagomlangt");
    expect(authenticate("vera.verify@example.com", "fel-losen")).toBeNull();
    expect(authenticate("vera.verify@example.com", "lagomlangt")?.id).toBe(verified!.id);
  });

  it("issues a one-use password reset token", () => {
    const anna = authenticate(DEMO_EMAIL, DEMO_PASSWORD);
    expect(anna).toBeTruthy();
    createPasswordResetToken(anna!.id, "reset-test-token");
    expect(peekPasswordResetToken("reset-test-token")?.id).toBe(anna!.id);
    expect(consumePasswordResetToken("reset-test-token")?.id).toBe(anna!.id);
    expect(consumePasswordResetToken("reset-test-token")).toBeNull();
    expect(authenticate(DEMO_EMAIL, "fel")).toBeNull();
  });

  it("keeps the demo host signed in after a store-backed password check", () => {
    const first = authenticate(DEMO_EMAIL, DEMO_PASSWORD);
    const again = authenticate(DEMO_EMAIL, DEMO_PASSWORD);
    expect(first?.id).toBe("profile_anna");
    expect(again?.id).toBe(first?.id);
  });
});

describe("homes and guest guide", () => {
  it("creates, edits and updates a guest guide without leaking notes", () => {
    const host = registerTrialAccount({
      firstName: "Host",
      lastName: "One",
      email: "host.one@example.com",
      phone: "+46704444444",
      phoneCountry: "SE",
      country: "ES",
      locale: "sv",
      unitBand: "1-5",
      marketingConsent: false,
      organizationName: "Host One",
      accountType: "private",
    });
    const home = createProperty(host.organizationId, homeInput("Villa Test"));
    updateProperty(host.organizationId, home.id, { city: "Estepona", notes: "Intern kod 9999" });
    updatePropertyGuide(host.organizationId, home.id, {
      wifiName: "VillaTest-Guest",
      wifiPassword: "Exempel2026",
      checkIn: "16:00",
      checkOut: "11:00",
      houseRules: { sv: "Ingen rökning.", en: "No smoking.", es: "No fumar." },
    });
    const place = createPlace(host.organizationId, {
      category: "restaurants",
      name: "Café Exempel",
      description: { sv: "Testställe", en: "Example cafe", es: "Café de ejemplo" },
    });
    assignPlaceToProperty(host.organizationId, home.id, place.id);
    expect(place.organizationId).toBe(host.organizationId);
    const guide = getPropertyGuide(home.id);
    expect(guide?.wifiName).toBe("VillaTest-Guest");
    const publicGuide = getGuestGuide(home.reportToken);
    const raw = JSON.stringify(publicGuide);
    expect(publicGuide?.property.name).toBe("Villa Test");
    expect(publicGuide?.places.some((item) => item.place.name === "Café Exempel")).toBe(true);
    expect(raw).not.toContain("Intern kod 9999");
    expect(publicGuide?.property).not.toHaveProperty("notes");
    expect(publicGuide?.property).not.toHaveProperty("tenantEmail");
  });

  it("keeps two organisations isolated and rejects missing or revoked QR tokens", () => {
    expect(getPropertyByToken("finns-inte")).toBeUndefined();
    expect(getGuestGuide("finns-inte")).toBeUndefined();
    const home = listProperties(ORG).find((item) => item.reportToken === "qr_solsidan")!;
    revokeGuestLink(ORG, home.id);
    expect(getPropertyByToken("qr_solsidan")).toBeUndefined();
    expect(getGuestGuide("qr_solsidan")).toBeUndefined();
    expect(listProperties(ORG).some((item) => item.organizationId === OTHER)).toBe(false);
    expect(authenticate(TEST_OTHER_HOST_EMAIL, DEMO_PASSWORD)?.organizationId).toBe(OTHER);
  });
});

describe("issues and uploads", () => {
  it("creates a report with a valid photo and rejects a spoofed type", () => {
    const created = submitReport({
      propertyToken: "qr_solsidan",
      category: "other",
      priority: "soon",
      title: "Testfel",
      description: "Endast testdata.",
      discoveredAt: new Date().toISOString(),
      stillOngoing: true,
      reporterName: "Testgäst",
      reporterPhone: "",
      reporterEmail: "",
      photos: [{ url: png, caption: "Test" }],
    });
    expect(listCases(ORG).some((item) => item.id === created.id)).toBe(true);
    const open = updateCaseStatus(ORG, created.id, "in_progress", "Anna");
    expect(open.status).toBe("in_progress");
    const done = updateCaseStatus(ORG, created.id, "resolved", "Anna");
    expect(done.status).toBe("resolved");
    expect(parsePhotoPayload(JSON.stringify([{ url: png }])).ok).toBe(true);
    expect(
      parsePhotoPayload(JSON.stringify([{ url: "data:image/svg+xml;base64,PHN2Zz4=" }])).ok,
    ).toBe(false);
  });
});

describe("public language surfaces", () => {
  it("keeps login, register, demo and error copy translated in sv/en/es", () => {
    expect(sv.errors.password).toBe("Lösenordet behöver minst 8 tecken.");
    expect(en.errors.password).toBe("The password must be at least 8 characters.");
    expect(es.errors.password).toBe("La contraseña debe tener al menos 8 caracteres.");
    expect(es.errors.login).not.toBe(en.errors.login);
    expect(es.errors.exists).not.toBe(en.errors.exists);
    expect(sv.login.title).toMatch(/Logga in/i);
    expect(en.login.title).toMatch(/Log in|Sign in/i);
    expect(es.login.title).toMatch(/Iniciar sesión/i);
    expect(sv.demo.tryGuest).toBe("Öppna gästguiden");
    expect(en.demo.tryGuest).toBe("Open the guest guide");
    expect(es.demo.tryGuest).toBe("Abrir la guía de huésped");
    expect(sv.marketing.form.invalidPhone).toBeTruthy();
    expect(en.marketing.form.invalidPhone).toBeTruthy();
    expect(es.marketing.form.invalidPhone).toBeTruthy();
  });

  it("blocks a filled honeypot without treating it as a validation error", () => {
    const source = readFileSync("src/lib/pilot-actions.ts", "utf8");
    expect(source).toContain('if (String(formData.get("website") ?? "").trim()) return { ok: true }');
  });
});

describe("demo and founder inbox", () => {
  it("uses example guest data and the founder test inbox", () => {
    expect(sv.demo.homeName).toBe("Villa Sol");
    expect(sv.register.subtitlePrivate).toMatch(/egna boendet/i);
    expect(sv.register.subtitleCompany).toMatch(/förvaltare/i);
    expect(sv.demo.note.toLowerCase()).toContain("exempel");
    expect(FOUNDER_EMAIL).toBe("juliuswalden8@gmail.com");
    const guide = getGuestGuide("qr_solsidan");
    expect(guide?.property.name).toBe("Villa Sol");
    expect(guide?.guide.welcome.es).toMatch(/ejemplo/i);
    expect(es.guide.stay).not.toBe(en.guide.stay);
    expect(es.report.title).not.toBe(en.report.title);
    expect(es.nav.overview).toMatch(/resumen/i);
    expect(es.dashboard.greetingMorning).toMatch(/buenos días/i);
    expect(es.homes.title).toMatch(/viviendas/i);
    const raw = JSON.stringify(guide);
    expect(raw).not.toContain("9912");
    expect(raw).not.toContain("@homioqo.se");
    expect(raw).not.toContain("4471");
    expect(raw).not.toContain("Havet2026");
    expect(raw).not.toContain("08-123");
    expect(raw).toContain("EXAMPLE-WIFI");
    expect(raw).toContain("example-pass-000");
    expect(raw).toContain("vard@example.com");
    expect(raw).toContain("000-000 00 00");
  });
});
