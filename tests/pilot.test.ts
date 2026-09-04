import { beforeEach, describe, expect, it } from "vitest";
import { canManageOrg } from "@/lib/access/permissions";
import {
  DEMO_PASSWORD,
  FOUNDER_EMAIL,
  PRICE_MONTHLY_EUR,
  PRICE_SETUP_EUR,
  QR_SIGN_PRICE_EUR,
  TEST_CLEANER_EMAIL,
  TEST_CONTRACTOR_EMAIL,
  TEST_OTHER_HOST_EMAIL,
  TEST_OWNER_EMAIL,
  TRIAL_DAYS,
  TRIAL_PROPERTY_LIMIT,
  founderInbox,
} from "@/lib/constants";
import {
  authenticate,
  canAddProperty,
  contractorAddPhotos,
  contractorUpdateStatus,
  createCleaningJob,
  createProperty,
  getActiveMembership,
  getGuestGuide,
  getOrganization,
  getUsageMetrics,
  isPropertyCapLifted,
  listCases,
  listCasesForMembership,
  listCleaningJobsForMembership,
  listProperties,
  listPropertiesForMembership,
  registerTrialAccount,
  resetStore,
  savePayPerHomeMonth,
  setCaseWorkOrder,
  submitReport,
  updateOrganization,
} from "@/lib/data/store";
import { sv } from "@/i18n/messages";

const ORG = "org_bergstrom";
const OTHER = "org_norrbo";

function homeInput(name: string) {
  return {
    name,
    address: `${name} 1`,
    city: "Malmö",
    country: "Sverige",
    countryCode: "SE",
    imageUrl: "",
    type: "apartment" as const,
    sqm: 40,
    rooms: 1,
    tenantName: "Gäst",
    tenantEmail: "",
    tenantPhone: "",
    leaseStart: new Date().toISOString(),
    leaseEnd: new Date().toISOString(),
    lastInspection: new Date().toISOString(),
  };
}

beforeEach(() => {
  resetStore();
});

describe("dedicated test accounts", () => {
  it("lets host, cleaner, contractor, owner and the other-org host sign in", () => {
    expect(authenticate("anna@homioqo.se", DEMO_PASSWORD)?.id).toBe("profile_anna");
    expect(authenticate(TEST_CLEANER_EMAIL, DEMO_PASSWORD)?.id).toBe("profile_maria");
    expect(authenticate(TEST_CONTRACTOR_EMAIL, DEMO_PASSWORD)?.id).toBe("profile_omar");
    expect(authenticate(TEST_OWNER_EMAIL, DEMO_PASSWORD)?.id).toBe("profile_lina");
    expect(authenticate(TEST_OTHER_HOST_EMAIL, DEMO_PASSWORD)?.organizationId).toBe(OTHER);
  });
});

describe("guest report to contractor complete", () => {
  it("lets the host assign the seeded contractor, who then uploads an after photo and finishes", () => {
    const created = submitReport({
      propertyToken: "qr_solsidan",
      category: "lock",
      priority: "soon",
      title: "Dörren kärvar igen",
      description: "Nyckeln tar inte i låset efter regn.",
      discoveredAt: new Date().toISOString(),
      stillOngoing: true,
      reporterName: "Gäst",
      reporterPhone: "",
      reporterEmail: "",
      photos: [{ url: "data:image/png;base64,AAAA", caption: "Lås" }],
    });

    expect(listCases(ORG).some((item) => item.id === created.id)).toBe(true);

    const assigned = setCaseWorkOrder({
      organizationId: ORG,
      caseId: created.id,
      contractorId: "con_las",
      instructions: "Ta med grafit.",
      actorName: "Anna Bergström",
    });
    expect(assigned.contractorId).toBe("con_las");
    expect(assigned.workToken).toMatch(/^wk_/);

    const omar = getActiveMembership("profile_omar", ORG, "contractor");
    expect(omar).toBeTruthy();
    const visible = listCasesForMembership(omar!);
    expect(visible.some((item) => item.id === created.id)).toBe(true);

    const documented = contractorAddPhotos({
      token: assigned.workToken!,
      kind: "after",
      photos: [{ url: "data:image/png;base64,BBBB", caption: "Efter" }],
      actorName: "Omar Nasser",
    });
    expect(documented.attachments.some((item) => item.kind === "after")).toBe(true);

    const finished = contractorUpdateStatus({
      token: assigned.workToken!,
      status: "resolved",
      actorName: "Omar Nasser",
    });
    expect(finished.status).toBe("resolved");
    expect(finished.completedAt).toBeTruthy();
  });

  it("lets the host assign a cleaning job that the cleaner account can see", () => {
    const job = createCleaningJob({
      organizationId: ORG,
      propertyId: "prop_solsidan",
      cleanerId: "cln_solsidan",
      scheduledAt: new Date().toISOString(),
      instructions: "Efter utcheckning",
      labels: {},
    });
    const maria = getActiveMembership("profile_maria", ORG, "cleaner");
    const jobs = listCleaningJobsForMembership(maria!);
    expect(jobs.some((item) => item.id === job.id)).toBe(true);
  });
});

describe("role isolation", () => {
  it("does not let the cleaner see the other organisation or host settings", () => {
    const maria = getActiveMembership("profile_maria", ORG, "cleaner");
    expect(maria).toBeTruthy();
    expect(canManageOrg(maria!)).toBe(false);
    expect(listPropertiesForMembership(maria!).some((item) => item.organizationId === OTHER)).toBe(
      false,
    );
    expect(listProperties(OTHER).some((item) => item.id === "prop_norrbo")).toBe(true);
    expect(listCleaningJobsForMembership(maria!).every((job) => job.organizationId === ORG)).toBe(
      true,
    );
  });

  it("never shows owner notes or emails on the public guest guide", () => {
    const guide = getGuestGuide("qr_norrbo");
    const raw = JSON.stringify(guide);
    expect(guide?.property.name).toBe("Fjällstugan Norrbo");
    expect(raw).not.toContain("Intern nyckelkod");
    expect(raw).not.toContain("9912");
    expect(guide?.property).not.toHaveProperty("notes");
    expect(guide?.property).not.toHaveProperty("tenantEmail");
  });
});

describe("pilot cap and prices", () => {
  it("blocks a sixth home on a trial org and lifts the cap when marked complete", () => {
    const host = registerTrialAccount({
      firstName: "Lisa",
      lastName: "Pilot",
      email: "lisa-pilot@example.com",
      phone: "+46702222222",
      phoneCountry: "SE",
      country: "SE",
      locale: "sv",
      unitBand: "1-5",
      marketingConsent: false,
      organizationName: "Pilot hus",
      accountType: "private",
    });
    expect(TRIAL_DAYS).toBe(30);
    expect(TRIAL_PROPERTY_LIMIT).toBe(5);
    expect(isPropertyCapLifted(getOrganization(host.organizationId))).toBe(false);

    for (let i = 0; i < 5; i += 1) {
      createProperty(host.organizationId, homeInput(`Pilot ${i}`));
    }
    expect(canAddProperty(host.organizationId)).toBe(false);
    expect(() => createProperty(host.organizationId, homeInput("Pilot 6"))).toThrow("property_limit");

    updateOrganization(host.organizationId, { pilotComplete: true });
    expect(canAddProperty(host.organizationId)).toBe(true);
    expect(createProperty(host.organizationId, homeInput("Pilot 6")).name).toBe("Pilot 6");
  });

  it("sends founder notices to the founder Gmail when ADMIN_EMAIL is unset", () => {
    expect(FOUNDER_EMAIL).toBe("juliuswalden8@gmail.com");
    if (!process.env.ADMIN_EMAIL && !process.env.CONTACT_EMAIL) {
      expect(founderInbox()).toBe(FOUNDER_EMAIL);
    }
  });

  it("shows founder prices and stores a host research answer on the org", () => {
    expect(PRICE_MONTHLY_EUR).toBe(14);
    expect(PRICE_SETUP_EUR).toBe(49);
    expect(QR_SIGN_PRICE_EUR).toBe(49);
    expect(sv.settings.priceMonth).toContain("{price}");
    expect(sv.qrOrder.price).toContain("€");

    const org = savePayPerHomeMonth(ORG, "14-20");
    expect(org.payPerHomeMonth).toBe("14-20");
  });

  it("reports scans, reports, wifi copies, cleanings and handled cases without inventing a saved-questions count", () => {
    const usage = getUsageMetrics(ORG);
    expect(usage.scans).toBeGreaterThan(0);
    expect(usage.reports).toBeGreaterThan(0);
    expect(usage.wifiCopies).toBeGreaterThan(0);
    expect(usage.guideViews).toBe(usage.scans);
    expect(usage.cleaningsCompleted).toBeGreaterThan(0);
    expect(usage.handledCases).toBeGreaterThan(0);
    expect(usage).not.toHaveProperty("questionsSaved");
  });
});
