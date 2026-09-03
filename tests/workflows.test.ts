import { beforeEach, describe, expect, it } from "vitest";
import { signValue, unsignValue } from "@/lib/crypto";
import { validatePilotLead } from "@/lib/pilot-schema";
import {
  addCaseNote,
  approveCase,
  contractorAddPhotos,
  contractorRespond,
  contractorUpdateStatus,
  createCleaningJob,
  createManagerCase,
  createOwnerAccess,
  createProperty,
  createPilotLead,
  getCase,
  getCaseByWorkToken,
  getCleaningJobByToken,
  getDashboardStats,
  getGuestGuide,
  getOwnerView,
  getProperty,
  getPropertyByToken,
  getPropertyTraffic,
  listCases,
  listCleaners,
  listContractors,
  listPilotLeads,
  listProperties,
  reopenCase,
  reportCleaningIssue,
  resetStore,
  rotateOwnerAccess,
  rotateWorkToken,
  setCaseWorkOrder,
  setOwnerAccessActive,
  submitReport,
  toggleCleaningItem,
  updateCleaningStatus,
} from "@/lib/data/store";

const ORG = "org_bergstrom";
const MANAGER = "Anna Bergström";

/** A second organisation, used to prove tenant isolation rather than assume it. */
function otherOrgProperty() {
  return createProperty("org_intruder", {
    name: "Intruder House",
    address: "Nowhere 1",
    city: "Nowhere",
    country: "Sverige",
    countryCode: "SE",
    imageUrl: "",
    type: "apartment",
    sqm: 50,
    rooms: 2,
    tenantName: "Someone",
    tenantEmail: "",
    tenantPhone: "",
    leaseStart: new Date().toISOString(),
    leaseEnd: new Date().toISOString(),
    lastInspection: new Date().toISOString(),
  });
}

beforeEach(() => {
  resetStore();
});

describe("property management", () => {
  it("creates a property that the manager can then read back", () => {
    const before = listProperties(ORG).length;
    const created = createProperty(ORG, {
      name: "Villa Test",
      address: "Testgatan 1",
      city: "Malmö",
      country: "Sverige",
      countryCode: "SE",
      imageUrl: "",
      type: "villa",
      sqm: 120,
      rooms: 4,
      tenantName: "Test Tenant",
      tenantEmail: "test@example.com",
      tenantPhone: "+46700000000",
      leaseStart: new Date().toISOString(),
      leaseEnd: new Date().toISOString(),
      lastInspection: new Date().toISOString(),
    });

    expect(listProperties(ORG)).toHaveLength(before + 1);
    expect(getProperty(ORG, created.id)?.name).toBe("Villa Test");
  });

  it("gives every new property a QR access token that resolves a guest guide", () => {
    const created = createProperty(ORG, {
      name: "QR Test",
      address: "QR 1",
      city: "Malmö",
      country: "Sverige",
      countryCode: "SE",
      imageUrl: "",
      type: "apartment",
      sqm: 60,
      rooms: 2,
      tenantName: "Tenant",
      tenantEmail: "",
      tenantPhone: "",
      leaseStart: new Date().toISOString(),
      leaseEnd: new Date().toISOString(),
      lastInspection: new Date().toISOString(),
    });

    expect(created.reportToken).toMatch(/^qr_[0-9a-f]{36}$/);
    expect(getPropertyByToken(created.reportToken)?.id).toBe(created.id);

    const guide = getGuestGuide(created.reportToken);
    expect(guide?.property.name).toBe("QR Test");
    expect(guide?.guide.checkIn).toBeTruthy();
  });

  it("supports search and filtering", () => {
    expect(listProperties(ORG, { query: "solsidan" })).toHaveLength(1);
    expect(listProperties(ORG, { query: "zzzz" })).toHaveLength(0);
    const stockholm = listProperties(ORG, { city: "Stockholm" });
    expect(stockholm.every((p) => p.city === "Stockholm")).toBe(true);
  });
});

describe("guest reporting", () => {
  it("turns a guest report into a case visible on the dashboard", () => {
    const property = listProperties(ORG).find((p) => p.name === "Villa Solsidan");
    expect(property).toBeDefined();

    const before = getDashboardStats(ORG);
    const created = submitReport({
      propertyToken: property!.reportToken,
      category: "water",
      priority: "urgent",
      title: "Läcka under diskbänken",
      description: "Det droppar vatten under diskbänken i köket.",
      discoveredAt: new Date().toISOString(),
      stillOngoing: true,
      reporterName: "Gäst",
      reporterPhone: "",
      reporterEmail: "",
      photos: [],
    });

    expect(created.status).toBe("new");
    expect(created.reference).toMatch(/^HQ-\d{4}-\d{4}$/);
    expect(created.trackToken).toMatch(/^tr_/);

    const after = getDashboardStats(ORG);
    expect(after.newCases).toBe(before.newCases + 1);
    expect(after.openCases).toBe(before.openCases + 1);
    expect(after.urgentCases).toBe(before.urgentCases + 1);

    expect(listCases(ORG).some((c) => c.id === created.id)).toBe(true);
    expect(listCases(ORG, { query: created.reference })).toHaveLength(1);
  });

  it("rejects a report for an unknown property token", () => {
    expect(() =>
      submitReport({
        propertyToken: "qr_does_not_exist",
        category: "other",
        priority: "low",
        title: "x",
        description: "x",
        discoveredAt: new Date().toISOString(),
        stillOngoing: true,
        reporterName: "",
        reporterPhone: "",
        reporterEmail: "",
        photos: [],
      }),
    ).toThrow();
  });
});

describe("contractor workflow", () => {
  function assignedCase() {
    const item = listCases(ORG)[0]!;
    const contractor = listContractors(ORG)[0]!;
    return setCaseWorkOrder({
      organizationId: ORG,
      caseId: item.id,
      contractorId: contractor.id,
      instructions: "Ta med reservdelar.",
      actorName: MANAGER,
    });
  }

  it("mints a secure work token when a contractor is assigned", () => {
    const item = assignedCase();
    expect(item.workToken).toMatch(/^wk_[0-9a-f]{36}$/);
    expect(item.status).not.toBe("new");
    expect(getCaseByWorkToken(item.workToken!)?.id).toBe(item.id);
  });

  it("scopes the work token to exactly one task", () => {
    const item = assignedCase();
    const resolved = getCaseByWorkToken(item.workToken!);
    expect(resolved?.id).toBe(item.id);
    expect(getCaseByWorkToken("wk_guessed")).toBeUndefined();
    // An empty token must never match a case that has no token set.
    expect(getCaseByWorkToken("")).toBeUndefined();
  });

  it("lets the contractor accept, progress, document and finish the task", () => {
    const item = assignedCase();
    const token = item.workToken!;

    const accepted = contractorRespond({ token, accept: true, actorName: "Costa Service" });
    expect(accepted.status).toBe("accepted");
    expect(accepted.contractorAcceptedAt).toBeTruthy();

    const started = contractorUpdateStatus({
      token,
      status: "in_progress",
      actorName: "Costa Service",
    });
    expect(started.status).toBe("in_progress");

    contractorAddPhotos({
      token,
      kind: "before",
      photos: [{ url: "data:image/png;base64,AAAA" }],
      actorName: "Costa Service",
    });
    const documented = contractorAddPhotos({
      token,
      kind: "after",
      photos: [{ url: "data:image/png;base64,BBBB" }],
      actorName: "Costa Service",
    });
    expect(documented.attachments.filter((a) => a.kind === "before")).toHaveLength(1);
    expect(documented.attachments.filter((a) => a.kind === "after")).toHaveLength(1);

    const finished = contractorUpdateStatus({
      token,
      status: "resolved",
      actorName: "Costa Service",
    });
    expect(finished.status).toBe("resolved");
    expect(finished.completedAt).toBeTruthy();
  });

  it("revokes the link when the contractor declines", () => {
    const item = assignedCase();
    const token = item.workToken!;
    const declined = contractorRespond({
      token,
      accept: false,
      reason: "Fullbokad",
      actorName: "Costa Service",
    });

    expect(declined.status).toBe("waiting");
    expect(declined.declineReason).toBe("Fullbokad");
    expect(declined.workToken).toBeUndefined();
    expect(getCaseByWorkToken(token)).toBeUndefined();
  });

  it("revokes the old link when the token is rotated", () => {
    const item = assignedCase();
    const old = item.workToken!;
    const next = rotateWorkToken(ORG, item.id);

    expect(next).not.toBe(old);
    expect(getCaseByWorkToken(old)).toBeUndefined();
    expect(getCaseByWorkToken(next!)?.id).toBe(item.id);
  });

  it("revokes the link once the manager approves, and reopening issues a new one", () => {
    const item = assignedCase();
    const token = item.workToken!;
    contractorRespond({ token, accept: true, actorName: "Costa Service" });
    contractorUpdateStatus({ token, status: "resolved", actorName: "Costa Service" });

    const approved = approveCase(ORG, item.id, MANAGER);
    expect(approved.status).toBe("approved");
    expect(approved.workToken).toBeUndefined();
    expect(getCaseByWorkToken(token)).toBeUndefined();

    const reopened = reopenCase(ORG, item.id, MANAGER);
    expect(reopened.status).toBe("in_progress");
    expect(reopened.workToken).toBeTruthy();
    expect(reopened.approvedAt).toBeUndefined();
  });
});

describe("cleaning workflow", () => {
  function job() {
    const property = listProperties(ORG)[0]!;
    const cleaner = listCleaners(ORG)[0];
    return createCleaningJob({
      organizationId: ORG,
      propertyId: property.id,
      cleanerId: cleaner?.id,
      scheduledAt: new Date().toISOString(),
      instructions: "Standardstädning",
      labels: {},
    });
  }

  it("creates a job with a default checklist and a secure cleaner link", () => {
    const created = job();
    expect(created.accessToken).toMatch(/^cln_/);
    expect(created.checklist.length).toBeGreaterThan(0);
    expect(created.checklist.every((c) => !c.done)).toBe(true);
    expect(getCleaningJobByToken(created.accessToken)?.id).toBe(created.id);
  });

  it("lets the cleaner complete the checklist and marks the property guest-ready", () => {
    const created = job();
    const token = created.accessToken;

    for (const check of created.checklist) {
      toggleCleaningItem(token, check.id, true);
    }
    const checked = getCleaningJobByToken(token)!;
    expect(checked.checklist.every((c) => c.done)).toBe(true);

    const done = updateCleaningStatus(token, "completed", true);
    expect(done.status).toBe("completed");
    expect(getProperty(ORG, created.propertyId)?.guestReady).toBe(true);
  });

  it("turns damage reported during cleaning into a maintenance case", () => {
    const created = job();
    const before = listCases(ORG).length;

    const updated = reportCleaningIssue({
      token: created.accessToken,
      kind: "damage",
      text: "Trasig spegel i badrummet",
      convert: true,
      reporterName: "Maria Cleaning",
    });

    const issue = updated.issues[0]!;
    expect(issue.convertedCaseId).toBeTruthy();
    expect(listCases(ORG)).toHaveLength(before + 1);

    const converted = getCase(ORG, issue.convertedCaseId!);
    expect(converted?.description).toContain("Trasig spegel i badrummet");
    expect(converted?.propertyId).toBe(created.propertyId);
  });
});

describe("owner access", () => {
  function access() {
    const property = listProperties(ORG).find((p) => p.name === "Villa Solsidan")!;
    return createOwnerAccess({
      organizationId: ORG,
      propertyId: property.id,
      ownerName: "Ägare Test",
      ownerEmail: "agare@example.com",
    });
  }

  it("exposes only the linked property", () => {
    const created = access();
    const view = getOwnerView(created.token)!;
    expect(view.property.name).toBe("Villa Solsidan");
    expect(view.property).not.toHaveProperty("tenantEmail");
    expect(view.property).not.toHaveProperty("notes");
    expect(view.property).not.toHaveProperty("reportToken");
  });

  it("hides internal notes and work photos until the manager approves", () => {
    const property = listProperties(ORG).find((p) => p.name === "Villa Solsidan")!;
    const item = listCases(ORG).find((c) => c.propertyId === property.id)!;
    const contractor = listContractors(ORG)[0]!;

    setCaseWorkOrder({
      organizationId: ORG,
      caseId: item.id,
      contractorId: contractor.id,
      actorName: MANAGER,
    });
    addCaseNote(ORG, item.id, MANAGER, "Ägaren får inte se detta");
    const token = getCase(ORG, item.id)!.workToken!;
    contractorRespond({ token, accept: true, actorName: contractor.name });
    contractorAddPhotos({
      token,
      kind: "after",
      photos: [{ url: "data:image/png;base64,CCCC" }],
      actorName: contractor.name,
    });
    contractorUpdateStatus({ token, status: "resolved", actorName: contractor.name });

    const created = access();
    const beforeApproval = getOwnerView(created.token)!;
    const serialisedBefore = JSON.stringify(beforeApproval);
    expect(serialisedBefore).not.toContain("Ägaren får inte se detta");
    expect(beforeApproval.cases.find((c) => c.id === item.id)?.photos).toHaveLength(0);

    approveCase(ORG, item.id, MANAGER);
    const afterApproval = getOwnerView(created.token)!;
    expect(afterApproval.cases.find((c) => c.id === item.id)?.photos.length).toBe(1);
    expect(JSON.stringify(afterApproval)).not.toContain("Ägaren får inte se detta");
  });

  it("can be revoked and rotated", () => {
    const created = access();
    expect(getOwnerView(created.token)).toBeDefined();

    setOwnerAccessActive(ORG, created.id, false);
    expect(getOwnerView(created.token)).toBeUndefined();

    setOwnerAccessActive(ORG, created.id, true);
    const rotated = rotateOwnerAccess(ORG, created.id);
    expect(getOwnerView(created.token)).toBeUndefined();
    expect(getOwnerView(rotated.token)).toBeDefined();
  });
});

describe("organisation isolation", () => {
  it("never returns another organisation's property", () => {
    const intruder = otherOrgProperty();
    expect(getProperty(ORG, intruder.id)).toBeUndefined();
    expect(listProperties(ORG).some((p) => p.id === intruder.id)).toBe(false);
    expect(listProperties("org_intruder")).toHaveLength(1);
  });

  it("never returns another organisation's case", () => {
    const item = listCases(ORG)[0]!;
    expect(getCase("org_intruder", item.id)).toBeUndefined();
    expect(listCases("org_intruder")).toHaveLength(0);
  });

  it("refuses cross-organisation mutations", () => {
    const item = listCases(ORG)[0]!;
    expect(() =>
      setCaseWorkOrder({
        organizationId: "org_intruder",
        caseId: item.id,
        contractorId: listContractors(ORG)[0]!.id,
        actorName: "Intruder",
      }),
    ).toThrow();
    expect(() => approveCase("org_intruder", item.id, "Intruder")).toThrow();
    expect(() => addCaseNote("org_intruder", item.id, "Intruder", "x")).toThrow();
  });

  it("refuses to assign a contractor belonging to another organisation", () => {
    const item = listCases(ORG)[0]!;
    expect(() =>
      setCaseWorkOrder({
        organizationId: ORG,
        caseId: item.id,
        contractorId: "con_from_nowhere",
        actorName: MANAGER,
      }),
    ).toThrow();
  });

  it("refuses to create owner access for another organisation's property", () => {
    const property = listProperties(ORG)[0]!;
    expect(() =>
      createOwnerAccess({
        organizationId: "org_intruder",
        propertyId: property.id,
        ownerName: "Intruder",
        ownerEmail: "intruder@example.com",
      }),
    ).toThrow();
  });
});

describe("session cookie signing", () => {
  it("round-trips a signed value", () => {
    const signed = signValue("profile_anna:org_bergstrom");
    expect(signed).not.toBe("profile_anna:org_bergstrom");
    expect(unsignValue(signed)).toBe("profile_anna:org_bergstrom");
  });

  it("rejects an unsigned cookie built from predictable ids", () => {
    expect(unsignValue("profile_anna:org_bergstrom")).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const signed = signValue("profile_anna:org_bergstrom");
    const mac = signed.slice(signed.lastIndexOf(".") + 1);
    expect(unsignValue(`profile_intruder:org_other.${mac}`)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const signed = signValue("profile_anna:org_bergstrom");
    expect(unsignValue(`${signed}x`)).toBeNull();
  });
});

describe("pilot leads", () => {
  it("stores a submitted enquiry", () => {
    const lead = createPilotLead({
      name: "Test Person",
      company: "Test AB",
      email: "test@example.com",
      phone: "",
      region: "Stockholm",
      propertyCount: "6-20",
      rentalType: "shortTerm",
      currentMethod: "WhatsApp",
      mostValuable: "Felanmälan",
      wantsPilot: true,
      consent: true,
      locale: "sv",
    });
    expect(lead.id).toBeTruthy();
    expect(lead.createdAt).toBeTruthy();
  });

  function pilotForm(overrides: Record<string, string> = {}) {
    const base: Record<string, string> = {
      name: "Anna Bergström",
      company: "Bergström Fastigheter",
      email: "anna@example.com",
      phone: "+46 70 000 00 00",
      region: "Stockholm",
      propertyCount: "6-20",
      rentalType: "shortTerm",
      currentMethod: "WhatsApp och telefon",
      mostValuable: "Felanmälan från gäster",
      wantsPilot: "on",
      consent: "on",
      locale: "sv",
      ...overrides,
    };
    const data = new FormData();
    for (const [key, value] of Object.entries(base)) {
      if (value !== "") data.set(key, value);
    }
    return data;
  }

  it("accepts a complete submission and stores it", () => {
    const parsed = validatePilotLead(pilotForm());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const before = listPilotLeads().length;
    createPilotLead(parsed.data);
    const leads = listPilotLeads();
    expect(leads.length).toBe(before + 1);
    expect(leads[0].company).toBe("Bergström Fastigheter");
    expect(leads[0].consent).toBe(true);
  });

  it("rejects a submission without consent", () => {
    const parsed = validatePilotLead(pilotForm({ consent: "" }));
    expect(parsed).toMatchObject({ ok: false, error: "consent" });
  });

  it("rejects an invalid email address", () => {
    const parsed = validatePilotLead(pilotForm({ email: "not-an-email" }));
    expect(parsed).toMatchObject({ ok: false, error: "email" });
  });

  it("rejects a submission missing required fields", () => {
    const parsed = validatePilotLead(pilotForm({ name: "", company: "" }));
    expect(parsed).toMatchObject({ ok: false, error: "required" });
  });

  it("rejects an unknown rental type rather than storing it", () => {
    const parsed = validatePilotLead(pilotForm({ rentalType: "something-else" }));
    expect(parsed.ok).toBe(false);
  });

  it("allows a private host to omit company", () => {
    const parsed = validatePilotLead(pilotForm({ company: "", accountType: "private" }));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.accountType).toBe("private");
    expect(parsed.data.company).toBe("");
  });
});

describe("manager dashboard helpers", () => {
  it("sorts cases by priority with urgent first", () => {
    const sorted = listCases(ORG, { sort: "priority" });
    const ranks = { urgent: 0, soon: 1, normal: 2, low: 3 };
    for (let i = 1; i < sorted.length; i += 1) {
      expect(ranks[sorted[i]!.priority]).toBeGreaterThanOrEqual(ranks[sorted[i - 1]!.priority]);
    }
  });

  it("lets a manager create a case for a home in their organisation only", () => {
    const home = listProperties(ORG)[0];
    expect(home).toBeDefined();
    const created = createManagerCase({
      organizationId: ORG,
      propertyId: home!.id,
      category: "other",
      priority: "normal",
      title: "Manager case",
      description: "Created from the dashboard.",
      reporterName: MANAGER,
    });
    expect(created.organizationId).toBe(ORG);
    expect(created.status).toBe("new");
    expect(() =>
      createManagerCase({
        organizationId: "org_intruder",
        propertyId: home!.id,
        category: "other",
        priority: "normal",
        title: "Intruder",
        description: "Should fail.",
        reporterName: "Nope",
      }),
    ).toThrow();
  });

  it("counts QR scans and reports for the last 30 days", () => {
    const home = listProperties(ORG).find((p) => p.name === "Villa Solsidan");
    expect(home).toBeDefined();
    const traffic = getPropertyTraffic(ORG, home!.id);
    expect(traffic.scans).toBeGreaterThan(0);
    expect(traffic.guideOpens).toBe(traffic.scans);
    expect(getDashboardStats(ORG).deltas).toEqual(
      expect.objectContaining({
        propertyCount: expect.any(Number),
        newCases: expect.any(Number),
        openCases: expect.any(Number),
        resolvedThisMonth: expect.any(Number),
        urgentCases: expect.any(Number),
      }),
    );
  });
});
