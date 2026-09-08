import { beforeEach, describe, expect, it } from "vitest";
import { marketingEn, marketingEs } from "@/i18n/marketing";
import { en, es, sv } from "@/i18n/messages";
import {
  SEED_CLEANER_EMAIL,
  SEED_CONTRACTOR_EMAIL,
  SEED_FIXTURE_PASSWORD,
  SEED_HOST_EMAIL,
} from "@/lib/data/seed";
import {
  approveCase,
  authenticate,
  contractorAddPhotos,
  contractorRespond,
  contractorUpdateStatus,
  createManagerCase,
  getCase,
  getGuestGuide,
  getHostAttention,
  getMembership,
  listCases,
  listCasesForMembership,
  listCleaningJobs,
  listCleaningJobsForMembership,
  listContractors,
  listProperties,
  registerTrialAccount,
  resetStore,
  setCaseWorkOrder,
  updateCasePriority,
} from "@/lib/data/store";

const ORG = "org_bergstrom";
const png =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const IDENTICAL_OK = new Set([
  "Homioqo",
  "Homioqo Pro",
  "homioqo",
  "Wi-Fi",
  "WhatsApp",
  "QR",
  "PIN",
  "TV",
  "AC",
  "Eco",
  "Villa Sol",
  "Casa Luna",
  "Atelier 4",
  "Bergström Fastigheter",
  "Maria L.",
  "Erik S.",
  "John Julius Erik Walden",
  "Karl John Oliver Landen",
  "Instagram",
  "LinkedIn",
  "Villa",
  "Normal",
  "Internet",
  "Taxi",
  "Golf",
  "Affiliate",
  "VillaSol-Guest",
  "Solsken2026",
  "{date} · {time}",
  "{minutes} min",
  "Trattoria Mare, 6 min",
  "10 min",
]);

function leftoverEnglish(source: unknown, target: unknown, path = ""): string[] {
  if (typeof source === "string" && typeof target === "string") {
    if (
      source === target &&
      /[A-Za-z]{3}/.test(source) &&
      !IDENTICAL_OK.has(source) &&
      !source.startsWith("http") &&
      !source.includes("@") &&
      !/^[a-z][a-z0-9-]*$/.test(source)
    ) {
      return [`${path}=${source}`];
    }
    return [];
  }
  if (Array.isArray(source) && Array.isArray(target)) {
    return source.flatMap((item, index) => leftoverEnglish(item, target[index], `${path}[${index}]`));
  }
  if (source && target && typeof source === "object" && typeof target === "object") {
    return Object.keys(source as object).flatMap((key) =>
      leftoverEnglish(
        (source as Record<string, unknown>)[key],
        (target as Record<string, unknown>)[key],
        path ? `${path}.${key}` : key,
      ),
    );
  }
  return [];
}

beforeEach(() => {
  resetStore();
});

describe("copy and locale", () => {
  it("uses the requested digital QR trial line in every language", () => {
    expect(sv.register.offerItems).toContain("Digitala QR-koder för dina första fem bostäder");
    expect(en.register.offerItems).toContain("Digital QR codes for your first five homes");
    expect(es.register.offerItems).toContain("Códigos QR digitales para tus primeras cinco viviendas");
    expect(sv.register.offerItems.join(" ")).not.toContain("QR-koder för de första fem bostäderna");
  });

  it("keeps overview titles in the selected language", () => {
    expect(sv.nav.overview).toBe("Översikt");
    expect(en.nav.overview).toMatch(/overview/i);
    expect(es.nav.overview).toBe("Resumen");
    expect(es.cleaning.today).toBe("Hoy");
    expect(sv.cleaning.today).toMatch(/idag/i);
  });

  it("does not leave Spanish interface copy on English fallbacks", () => {
    expect(leftoverEnglish(en, es)).toEqual([]);
    expect(leftoverEnglish(marketingEn, marketingEs)).toEqual([]);
  });

  it("drops invented-savings copy and labels the usage period", () => {
    expect(sv.dashboard.usageHelp).toBe("Senaste 30 dagarna");
    expect(es.dashboard.usageHelp).toBe("Últimos 30 días");
    expect(sv.dashboard.usageHelp).not.toMatch(/abonnemang kopplas/i);
    expect(sv.dashboard.usageSelfServeHelp).toBe("");
    expect(sv.filters.sortDate).toBe("Nyast först");
    expect(es.filters.sortDate).toBe("Más recientes");
    expect(sv.dashboard.attention).toBe("Behöver din uppmärksamhet");
    expect(es.dashboard.attention).toBe("Necesita tu atención");
    expect(sv.login.demo).toBe("");
    expect(en.login.demo).toBe("");
    expect(es.login.demo).toBe("");
    expect(sv.dashboard.results30).toMatch(/30/);
    expect(es.dashboard.ringNoData).not.toBe(en.dashboard.ringNoData);
  });
});

describe("fixture roles and empty production store", () => {
  it("keeps seeded fixture roles available to tests only", () => {
    const host = authenticate(SEED_HOST_EMAIL, SEED_FIXTURE_PASSWORD);
    expect(host?.email).toBe(SEED_HOST_EMAIL);
    expect(host?.id).toBe("profile_anna");
    expect(getMembership("mem_anna_host")?.role).toBe("host");
  });

  it("opens the cleaner and contractor fixture roles", () => {
    const cleaner = authenticate(SEED_CLEANER_EMAIL, SEED_FIXTURE_PASSWORD);
    const contractor = authenticate(SEED_CONTRACTOR_EMAIL, SEED_FIXTURE_PASSWORD);
    expect(cleaner?.id).toBe("profile_maria");
    expect(contractor?.id).toBe("profile_omar");
    expect(getMembership("mem_maria_cleaner")?.role).toBe("cleaner");
    expect(getMembership("mem_omar_contractor")?.role).toBe("contractor");
    expect(listCleaningJobsForMembership(getMembership("mem_maria_cleaner")!).length).toBeGreaterThan(0);
    expect(listCasesForMembership(getMembership("mem_omar_contractor")!).length).toBeGreaterThan(0);
  });
});

describe("case workflow", () => {
  it("creates, prioritises, assigns, documents and resolves a test case", () => {
    const home = listProperties(ORG).find((item) => item.name === "Villa Sol")!;
    const created = createManagerCase({
      organizationId: ORG,
      propertyId: home.id,
      category: "water",
      priority: "normal",
      title: "QA läcka under diskbänken",
      description: "Testdata. Ingen riktig skada.",
      reporterName: "Anna Bergström",
    });
    expect(created.status).toBe("new");

    updateCasePriority(ORG, created.id, "urgent", "Anna Bergström");
    expect(getCase(ORG, created.id)?.priority).toBe("urgent");

    const contractor = listContractors(ORG).find((item) => item.id === "con_vvs")!;
    const assigned = setCaseWorkOrder({
      organizationId: ORG,
      caseId: created.id,
      contractorId: contractor.id,
      instructions: "Testdata: dokumentera före och efter.",
      actorName: "Anna Bergström",
    });
    expect(assigned.status).toBe("assigned");
    expect(assigned.workToken).toBeTruthy();

    contractorRespond({
      token: assigned.workToken!,
      accept: true,
      actorName: contractor.contactName,
    });
    contractorUpdateStatus({
      token: assigned.workToken!,
      status: "in_progress",
      actorName: contractor.contactName,
    });
    expect(getCase(ORG, created.id)?.status).toBe("in_progress");

    contractorAddPhotos({
      token: assigned.workToken!,
      kind: "before",
      photos: [{ url: png, caption: "Före" }],
      actorName: contractor.contactName,
    });
    contractorAddPhotos({
      token: assigned.workToken!,
      kind: "after",
      photos: [{ url: png, caption: "Efter" }],
      actorName: contractor.contactName,
    });
    contractorUpdateStatus({
      token: assigned.workToken!,
      status: "resolved",
      actorName: contractor.contactName,
    });
    const resolved = getCase(ORG, created.id)!;
    expect(resolved.status).toBe("resolved");
    expect(resolved.attachments.some((item) => item.kind === "before")).toBe(true);
    expect(resolved.attachments.some((item) => item.kind === "after")).toBe(true);

    approveCase(ORG, created.id, "Anna Bergström");
    expect(getCase(ORG, created.id)?.status).toBe("approved");
  });
});

describe("host attention hierarchy", () => {
  it("finds cases by assignee and puts urgent open work first", () => {
    const assigned = listCases(ORG).find((item) => item.contractor?.name);
    expect(assigned?.contractor?.name).toBeTruthy();
    const byAssignee = listCases(ORG, { query: assigned!.contractor!.name });
    expect(byAssignee.some((item) => item.id === assigned!.id)).toBe(true);

    const sorted = listCases(ORG);
    const firstOpenUrgent = sorted.find(
      (item) => item.priority === "urgent" && ["new", "reviewing", "assigned", "accepted", "in_progress", "waiting"].includes(item.status),
    );
    if (firstOpenUrgent) {
      expect(sorted[0]?.priority).toBe("urgent");
    }
  });

  it("summarises homes, urgent cases, unassigned work and today’s cleanings", () => {
    const attention = getHostAttention(ORG);
    expect(attention.needsAction.length).toBeGreaterThan(0);
    expect(attention.urgent.length).toBeGreaterThan(0);
    expect(attention.unassigned.length).toBeGreaterThan(0);
    expect(attention.recent.length).toBeGreaterThan(0);
  });
});

describe("empty states and isolation", () => {
  it("starts a new trial workspace empty", () => {
    const created = registerTrialAccount({
      firstName: "Test",
      lastName: "Host",
      email: "qa.empty@example.com",
      phone: "+46701112233",
      phoneCountry: "SE",
      country: "SE",
      locale: "sv",
      unitBand: "1-5",
      marketingConsent: false,
      organizationName: "QA Tomt AB",
      accountType: "company",
    });
    expect(listProperties(created.organizationId)).toEqual([]);
    expect(listCases(created.organizationId)).toEqual([]);
    expect(listCleaningJobs(created.organizationId)).toEqual([]);
    expect(sv.homes.empty).toMatch(/inga bostäder/i);
    expect(sv.dashboard.emptyCases).toMatch(/inga ärenden/i);
    expect(sv.cleaning.empty).toMatch(/inga städ/i);
    expect(es.homes.empty).toMatch(/alojamientos/i);
    expect(es.dashboard.emptyCases).toMatch(/incidencias/i);
    expect(es.cleaning.empty).toMatch(/limpiezas/i);
  });
});

describe("public guest guide", () => {
  it("hides owner internals, notes and demo login mail on the public Villa Sol guide", () => {
    const guide = getGuestGuide("qr_solsidan");
    expect(guide?.property.name).toBe("Villa Sol");
    expect(guide?.property).not.toHaveProperty("notes");
    expect(guide?.property).not.toHaveProperty("tenantEmail");
    expect(guide?.property).not.toHaveProperty("tenantPhone");
    const raw = JSON.stringify(guide);
    expect(raw).not.toContain("@homioqo.se");
    expect(raw).not.toContain("Intern");
    expect(raw).not.toContain("Ytterdörr mot sjösidan");
    expect(raw).not.toContain("anna@homioqo.se");
    expect(raw).not.toContain("holm@mail.se");
  });
});
