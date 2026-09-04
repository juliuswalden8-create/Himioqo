import { beforeEach, describe, expect, it } from "vitest";
import { sessionFromRaw } from "@/lib/access/session-cookie";
import {
  acceptInvitation,
  consumeLoginLink,
  createInvitation,
  createLoginLink,
  createMembership,
  createStaffProfile,
  getActiveMembership,
  getPropertyByToken,
  guestLinkIsOpen,
  listCasesForMembership,
  listCleaningJobsForMembership,
  listMembershipsForUser,
  listPropertiesForMembership,
  registerTrialAccount,
  resetStore,
  revokeGuestLink,
  setGuestLinkExpiry,
  setGuestPin,
  switchActiveMembership,
  verifyGuestPin,
} from "@/lib/data/store";

const ORG = "org_bergstrom";
const HOST = "profile_anna";
const HOST_MEM = "mem_anna_host";

beforeEach(() => {
  resetStore();
});

describe("session membership", () => {
  it("does not let a cleaner impersonate a host membership they do not own", () => {
    const cleaner = createStaffProfile({
      organizationId: ORG,
      firstName: "Mia",
      lastName: "Clean",
      email: "mia@clean.test",
      password: "demo1234",
    });
    const cleanerMem = createMembership({
      userId: cleaner.id,
      organizationId: ORG,
      role: "cleaner",
      propertyIds: ["prop_solsidan"],
      directoryId: "cln_solsidan",
    });

    expect(sessionFromRaw(`${cleaner.id}:${ORG}:host:${HOST_MEM}`)).toBeNull();
    expect(sessionFromRaw(`${cleaner.id}:${ORG}:host:${cleanerMem.id}`)?.role).toBe("cleaner");
    expect(sessionFromRaw(`${HOST}:${ORG}:host:${HOST_MEM}`)?.role).toBe("host");
  });

  it("legacy two-part cookies resolve to a host membership when one exists", () => {
    const session = sessionFromRaw(`${HOST}:${ORG}`);
    expect(session?.role).toBe("host");
    expect(session?.membershipId).toBe(HOST_MEM);
  });
});

describe("property scope", () => {
  it("lets an owner see only their own properties", () => {
    const ownerA = createStaffProfile({
      organizationId: ORG,
      firstName: "Ada",
      lastName: "Owner",
      email: "ada@owner.test",
    });
    const ownerB = createStaffProfile({
      organizationId: ORG,
      firstName: "Bo",
      lastName: "Owner",
      email: "bo@owner.test",
    });
    const memA = createMembership({
      userId: ownerA.id,
      organizationId: ORG,
      role: "owner",
      propertyIds: ["prop_strand"],
    });
    const memB = createMembership({
      userId: ownerB.id,
      organizationId: ORG,
      role: "owner",
      propertyIds: ["prop_vasa"],
    });

    const namesA = listPropertiesForMembership(memA).map((item) => item.id);
    const namesB = listPropertiesForMembership(memB).map((item) => item.id);
    expect(namesA).toEqual(["prop_strand"]);
    expect(namesB).toEqual(["prop_vasa"]);
    expect(namesA).not.toContain("prop_vasa");
  });
});

describe("staff isolation", () => {
  it("does not let cleaner A read cleaner B jobs", () => {
    const a = createStaffProfile({
      organizationId: ORG,
      firstName: "A",
      lastName: "Clean",
      email: "a@clean.test",
    });
    const b = createStaffProfile({
      organizationId: ORG,
      firstName: "B",
      lastName: "Clean",
      email: "b@clean.test",
    });
    const memA = createMembership({
      userId: a.id,
      organizationId: ORG,
      role: "cleaner",
      propertyIds: ["prop_solsidan", "prop_limhamn"],
      directoryId: "cln_solsidan",
    });
    const memB = createMembership({
      userId: b.id,
      organizationId: ORG,
      role: "cleaner",
      propertyIds: ["prop_vasa"],
      directoryId: "cln_other",
    });

    const jobsA = listCleaningJobsForMembership(memA);
    const jobsB = listCleaningJobsForMembership(memB);
    expect(jobsA.length).toBeGreaterThan(0);
    expect(jobsA.every((job) => job.cleanerId === "cln_solsidan")).toBe(true);
    expect(jobsB.some((job) => job.cleanerId === "cln_solsidan")).toBe(false);
  });

  it("does not let contractor A read contractor B cases", () => {
    const a = createStaffProfile({
      organizationId: ORG,
      firstName: "Omar",
      lastName: "Lock",
      email: "omar@con.test",
    });
    const b = createStaffProfile({
      organizationId: ORG,
      firstName: "Pablo",
      lastName: "Ac",
      email: "pablo@con.test",
    });
    const memA = createMembership({
      userId: a.id,
      organizationId: ORG,
      role: "contractor",
      propertyIds: ["prop_solsidan"],
      directoryId: "con_las",
    });
    const memB = createMembership({
      userId: b.id,
      organizationId: ORG,
      role: "contractor",
      propertyIds: ["prop_brisa"],
      directoryId: "con_costa",
    });

    const casesA = listCasesForMembership(memA);
    const casesB = listCasesForMembership(memB);
    expect(casesA.every((item) => item.contractorId === "con_las")).toBe(true);
    expect(casesB.every((item) => item.contractorId === "con_costa")).toBe(true);
    expect(casesA.some((item) => item.contractorId === "con_costa")).toBe(false);
  });
});

describe("invitations and login links", () => {
  it("creates a membership when an invite is accepted", () => {
    const { rawToken } = createInvitation({
      organizationId: ORG,
      email: "new.owner@test.se",
      role: "owner",
      propertyIds: ["prop_strand"],
      invitedByUserId: HOST,
    });
    const accepted = acceptInvitation(rawToken, { firstName: "Nova", lastName: "Owner" });
    expect(accepted?.membership.role).toBe("owner");
    expect(accepted?.membership.propertyIds).toEqual(["prop_strand"]);
    const memberships = listMembershipsForUser(accepted!.profile.id);
    expect(memberships.some((item) => item.role === "owner")).toBe(true);
  });

  it("lets a login link be used only once and rejects it after expiry", () => {
    const { rawToken, link } = createLoginLink({
      userId: HOST,
      intendedRole: "host",
      intendedOrganizationId: ORG,
    });
    const first = consumeLoginLink(rawToken);
    expect(first?.profile.id).toBe(HOST);
    expect(consumeLoginLink(rawToken)).toBeNull();

    const second = createLoginLink({
      userId: HOST,
      intendedRole: "host",
      intendedOrganizationId: ORG,
    });
    second.link.expiresAt = new Date(Date.now() - 1000).toISOString();
    expect(consumeLoginLink(second.rawToken)).toBeNull();
    expect(link.id).toBeTruthy();
  });
});

describe("guest links", () => {
  it("does not resolve expired or revoked guest tokens", () => {
    const open = getPropertyByToken("qr_strand14");
    expect(open?.id).toBe("prop_strand");

    setGuestLinkExpiry(ORG, "prop_strand", new Date(Date.now() - 1000).toISOString());
    expect(getPropertyByToken("qr_strand14")).toBeUndefined();

    resetStore();
    revokeGuestLink(ORG, "prop_strand");
    expect(getPropertyByToken("qr_strand14")).toBeUndefined();
    const property = getPropertyByToken("qr_vasa22");
    expect(property && guestLinkIsOpen(property)).toBe(true);
  });

  it("requires a guest PIN when one is set", () => {
    setGuestPin(ORG, "prop_strand", "4821");
    const property = getPropertyByToken("qr_strand14");
    expect(property?.guestPinHash).toBeTruthy();
    expect(verifyGuestPin(property!, "0000")).toBe(false);
    expect(verifyGuestPin(property!, "4821")).toBe(true);
  });
});

describe("multi-role switch", () => {
  it("switches the active membership between host and owner", () => {
    const ownerMem = createMembership({
      userId: HOST,
      organizationId: ORG,
      role: "owner",
      propertyIds: ["prop_brisa"],
    });
    const host = getActiveMembership(HOST, ORG, "host");
    expect(host?.role).toBe("host");
    const switched = switchActiveMembership(HOST, ownerMem.id);
    expect(switched?.role).toBe("owner");
    expect(sessionFromRaw(`${HOST}:${ORG}:owner:${ownerMem.id}`)?.role).toBe("owner");
    expect(listMembershipsForUser(HOST).length).toBeGreaterThanOrEqual(2);
  });
});

describe("trial signup", () => {
  it("creates a host membership on register", () => {
    const profile = registerTrialAccount({
      firstName: "Lisa",
      lastName: "Holm",
      email: "lisa-host@example.com",
      phone: "+46701111111",
      phoneCountry: "SE",
      country: "SE",
      locale: "sv",
      unitBand: "1-5",
      marketingConsent: false,
      organizationName: "Holm hus",
      accountType: "private",
    });
    const membership = getActiveMembership(profile.id, profile.organizationId, "host");
    expect(membership?.role).toBe("host");
  });
});
