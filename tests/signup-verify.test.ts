import { beforeEach, describe, expect, it } from "vitest";
import { sv } from "@/i18n/messages";
import {
  authenticate,
  consumeVerificationToken,
  getOrganization,
  registerTrialAccount,
  resetStore,
  setProfilePassword,
} from "@/lib/data/store";
import { welcomeEmailHtml, welcomeEmailText } from "@/lib/email/send";
import {
  decodeSignupTicket,
  encodeSignupTicket,
  ticketFromProfile,
} from "@/lib/signup-ticket";

beforeEach(() => {
  resetStore();
});

function registerHost(email = "lisa@example.com") {
  return registerTrialAccount({
    firstName: "Lisa",
    lastName: "Holm",
    email,
    phone: "+46701111111",
    phoneCountry: "SE",
    country: "SE",
    locale: "sv",
    unitBand: "1-5",
    marketingConsent: false,
    organizationName: "Holm hus",
    accountType: "private",
  });
}

describe("email verification tickets", () => {
  it("verifies a signup even after in-memory state is lost", () => {
    const profile = registerHost();
    const org = getOrganization(profile.organizationId);
    expect(org).toBeTruthy();
    const token = encodeSignupTicket(ticketFromProfile(profile, org!));

    resetStore();

    const verified = consumeVerificationToken(token);
    expect(verified?.email).toBe("lisa@example.com");
    expect(verified?.firstName).toBe("Lisa");
    expect(verified?.emailVerifiedAt).toBeTruthy();

    setProfilePassword(verified!.id, "hemligt12");
    const signedIn = authenticate("lisa@example.com", "hemligt12");
    expect(signedIn?.id).toBe(verified!.id);
  });

  it("rejects an expired ticket", () => {
    const profile = registerHost("expired@example.com");
    const org = getOrganization(profile.organizationId)!;
    const token = encodeSignupTicket({
      ...ticketFromProfile(profile, org),
      exp: Date.now() - 1000,
    });
    resetStore();
    expect(consumeVerificationToken(token)).toBeNull();
  });

  it("rejects a tampered ticket", () => {
    const profile = registerHost("tamper@example.com");
    const org = getOrganization(profile.organizationId)!;
    const token = encodeSignupTicket(ticketFromProfile(profile, org));
    expect(consumeVerificationToken(`${token}x`)).toBeNull();
    expect(decodeSignupTicket(token)?.em).toBe("tamper@example.com");
  });
});

describe("verification email", () => {
  it("uses the Homioqo verification copy and logo at the bottom", () => {
    const html = welcomeEmailHtml({
      dict: sv,
      firstName: "Lisa",
      verifyUrl: "https://himioqo.vercel.app/verify/abc",
      locale: "sv",
      logoUrl: "https://himioqo.vercel.app/brand/logo-email.png",
    });
    expect(html).toContain("Hej Lisa,");
    expect(html).toContain("Välkommen till Homioqo!");
    expect(html).toContain("Verifiera min e-postadress");
    expect(html).toContain("giltig i 24 timmar");
    expect(html).toContain("https://himioqo.vercel.app/verify/abc");
    expect(html).toContain("Enklare värdskap. Tryggare vistelser.");
    expect(html.lastIndexOf("logo-email.png")).toBeGreaterThan(html.lastIndexOf("Verifiera min e-postadress"));

    const text = welcomeEmailText({
      dict: sv,
      firstName: "Lisa",
      verifyUrl: "https://himioqo.vercel.app/verify/abc",
    });
    expect(text).toContain("Har du inte skapat ett konto hos Homioqo?");
    expect(text.endsWith("Enklare värdskap. Tryggare vistelser.")).toBe(true);
  });
});
