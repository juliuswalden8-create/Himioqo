import { beforeEach, describe, expect, it } from "vitest";
import { sessionFromRaw } from "@/lib/access/session-cookie";
import { LOGIN_LIMIT, LOGIN_WINDOW_MS } from "@/lib/constants";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import {
  bumpSessionVersion,
  consumePasswordResetToken,
  createInvitation,
  createMembership,
  createPasswordResetToken,
  createStaffProfile,
  getCase,
  getGuestGuide,
  getMembership,
  getPropertyByToken,
  listCasesForMembership,
  listPropertiesForMembership,
  peekPasswordResetToken,
  resetStore,
  revokeGuestLink,
  setProfilePassword,
  submitReport,
  updateCaseStatus,
} from "@/lib/data/store";
import { rateLimit } from "@/lib/rate-limit";
import { parsePhotoPayload } from "@/lib/uploads";

const ORG = "org_bergstrom";
const HOST = "profile_anna";
const HOST_MEM = "mem_anna_host";
const OTHER_ORG = "org_norrbo";

beforeEach(() => {
  resetStore();
});

const png =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("cross-account isolation", () => {
  it("does not let host A read host B properties", () => {
    const anna = listPropertiesForMembership({
      id: HOST_MEM,
      createdAt: "",
      updatedAt: "",
      userId: HOST,
      organizationId: ORG,
      role: "host",
      propertyIds: [],
    });
    const erikMem = createMembership({
      userId: "profile_erik",
      organizationId: OTHER_ORG,
      role: "host",
      propertyIds: [],
    });
    const erik = listPropertiesForMembership(erikMem);
    expect(anna.some((item) => item.organizationId === OTHER_ORG)).toBe(false);
    expect(erik.every((item) => item.organizationId === OTHER_ORG)).toBe(true);
    expect(erik.map((item) => item.id)).not.toEqual(expect.arrayContaining(anna.map((item) => item.id)));
  });
});

describe("role isolation", () => {
  it("does not elevate a cleaner to host via cookie role or membership id", () => {
    const cleaner = createStaffProfile({
      organizationId: ORG,
      firstName: "C",
      lastName: "Lean",
      email: "c@clean.security",
      password: "seed-fixture-only",
    });
    const mem = createMembership({
      userId: cleaner.id,
      organizationId: ORG,
      role: "cleaner",
      propertyIds: ["prop_solsidan"],
      directoryId: "cln_solsidan",
    });
    expect(sessionFromRaw(`${cleaner.id}:${ORG}:host:${HOST_MEM}`)).toBeNull();
    expect(sessionFromRaw(`${cleaner.id}:${ORG}:host:${mem.id}`)?.role).toBe("cleaner");
  });

  it("lets a contractor see only assigned cases", () => {
    const omarMem = getMembership("mem_omar_contractor");
    expect(omarMem).toBeDefined();
    const items = listCasesForMembership(omarMem!);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.contractorId === "con_las" || item.propertyId === "prop_solsidan")).toBe(
      true,
    );
  });
});

describe("unauthenticated and idor", () => {
  it("rejects an empty session cookie payload", () => {
    expect(sessionFromRaw("")).toBeNull();
    expect(sessionFromRaw("nope:org_bergstrom:host:mem_anna_host")).toBeNull();
  });

  it("rejects a case id from another organisation", () => {
    const home = listPropertiesForMembership({
      id: HOST_MEM,
      createdAt: "",
      updatedAt: "",
      userId: HOST,
      organizationId: ORG,
      role: "host",
      propertyIds: [],
    })[0]!;
    const created = submitReport({
      propertyToken: home.reportToken,
      category: "other",
      priority: "soon",
      title: "Leak",
      description: "Water",
      discoveredAt: new Date().toISOString(),
      stillOngoing: true,
      reporterName: "Guest",
      reporterPhone: "070",
      reporterEmail: "g@test.se",
      photos: [],
      locale: "sv",
    });
    expect(() => updateCaseStatus(OTHER_ORG, created.id, "in_progress", "X")).toThrow();
    expect(getCase(ORG, created.id)?.status).not.toBe("in_progress");
  });
});

describe("QR tokens", () => {
  it("rejects revoked and unknown tokens", () => {
    const home = listPropertiesForMembership({
      id: HOST_MEM,
      createdAt: "",
      updatedAt: "",
      userId: HOST,
      organizationId: ORG,
      role: "host",
      propertyIds: [],
    })[0]!;
    expect(getPropertyByToken("qr_not_a_real_token")).toBeUndefined();
    revokeGuestLink(ORG, home.id);
    expect(getPropertyByToken(home.reportToken)).toBeUndefined();
    expect(getGuestGuide(home.reportToken)).toBeUndefined();
  });
});

describe("uploads", () => {
  it("blocks svg, html, oversized and spoofed files", () => {
    const svg = parsePhotoPayload(JSON.stringify([{ url: "data:image/svg+xml;base64,PHN2Zz4=" }]));
    expect(svg.ok).toBe(false);
    if (!svg.ok) expect(svg.reason).toBe("type");

    const html = parsePhotoPayload(JSON.stringify([{ url: "data:text/html;base64,PGh0bWw+" }]));
    expect(html.ok).toBe(false);

    const spoofed = parsePhotoPayload(
      JSON.stringify([{ url: "data:image/jpeg;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==" }]),
    );
    expect(spoofed.ok).toBe(false);

    const huge = `data:image/png;base64,${"A".repeat(12 * 1024 * 1024)}`;
    const sized = parsePhotoPayload(JSON.stringify([{ url: huge }]));
    expect(sized.ok).toBe(false);

    const okPng = parsePhotoPayload(JSON.stringify([{ url: png, caption: "<script>alert(1)</script>" }]));
    expect(okPng.ok).toBe(true);
    if (okPng.ok) {
      expect(okPng.photos[0]?.caption).toBe("<script>alert(1)</script>");
      expect(okPng.photos[0]?.url.startsWith("data:image/png;base64,")).toBe(true);
    }
  });
});

describe("rate limit", () => {
  it("trips after too many attempts", () => {
    const key = `test:${Date.now()}`;
    let blocked = false;
    for (let i = 0; i < LOGIN_LIMIT + 2; i += 1) {
      const result = rateLimit(key, LOGIN_LIMIT, LOGIN_WINDOW_MS);
      if (!result.ok) blocked = true;
    }
    expect(blocked).toBe(true);
  });
});

describe("guest payload", () => {
  it("does not send internals, notes, emails or org ids", () => {
    const home = listPropertiesForMembership({
      id: HOST_MEM,
      createdAt: "",
      updatedAt: "",
      userId: HOST,
      organizationId: ORG,
      role: "host",
      propertyIds: [],
    }).find((item) => item.notes)!;
    const guest = getGuestGuide(home.reportToken);
    const raw = JSON.stringify(guest);
    expect(guest).toBeDefined();
    expect(guest?.property).not.toHaveProperty("id");
    expect(guest?.property).not.toHaveProperty("organizationId");
    expect(guest?.property).not.toHaveProperty("reportToken");
    expect(guest?.property).not.toHaveProperty("notes");
    expect(guest?.property).not.toHaveProperty("tenantEmail");
    expect(raw).not.toContain(home.notes);
    expect(raw).not.toContain(home.tenantEmail);
    expect(raw).not.toContain("<script>");
  });
});

describe("xss and injection stored as text", () => {
  it("stores a script tag as plain text on a report", () => {
    const home = listPropertiesForMembership({
      id: HOST_MEM,
      createdAt: "",
      updatedAt: "",
      userId: HOST,
      organizationId: ORG,
      role: "host",
      propertyIds: [],
    })[0]!;
    const created = submitReport({
      propertyToken: home.reportToken,
      category: "other",
      priority: "soon",
      title: "<script>alert(1)</script>",
      description: "'; DROP TABLE cases;--",
      discoveredAt: new Date().toISOString(),
      stillOngoing: true,
      reporterName: "<b>x</b>",
      reporterPhone: "070",
      reporterEmail: "g@test.se",
      photos: [],
      locale: "sv",
    });
    expect(created.title).toBe("<script>alert(1)</script>");
    expect(created.description).toBe("'; DROP TABLE cases;--");
    const guest = getGuestGuide(home.reportToken);
    expect(JSON.stringify(guest)).not.toContain("DROP TABLE");
  });
});

describe("passwords and reset", () => {
  it("never treats a plaintext string as a valid hash", () => {
    expect(verifyPassword("seed-fixture-only", "seed-fixture-only")).toBe(false);
    expect(verifyPassword("seed-fixture-only", hashPassword("seed-fixture-only"))).toBe(true);
  });

  it("issues a one-time timed reset token and revokes the old session version", () => {
    const raw = "reset-token-test";
    createPasswordResetToken(HOST, raw);
    expect(peekPasswordResetToken(raw)?.id).toBe(HOST);
    const profile = consumePasswordResetToken(raw);
    expect(profile?.id).toBe(HOST);
    expect(consumePasswordResetToken(raw)).toBeNull();
    setProfilePassword(HOST, "newpass12");
    expect(sessionFromRaw(`${HOST}:${ORG}:host:${HOST_MEM}:0`)).toBeNull();
  });

  it("invalidates cookies after session version bump", () => {
    expect(sessionFromRaw(`${HOST}:${ORG}:host:${HOST_MEM}`)?.profileId).toBe(HOST);
    bumpSessionVersion(HOST);
    expect(sessionFromRaw(`${HOST}:${ORG}:host:${HOST_MEM}`)).toBeNull();
  });
});

describe("invites cannot grant host to staff", () => {
  it("creates a cleaner invite, not a host role", () => {
    const invite = createInvitation({
      organizationId: ORG,
      email: "new@clean.security",
      role: "cleaner",
      propertyIds: ["prop_solsidan"],
      invitedByUserId: HOST,
    });
    expect(invite.invitation.role).toBe("cleaner");
    expect(() =>
      createInvitation({
        organizationId: ORG,
        email: "boss@host.security",
        role: "host",
        propertyIds: [],
        invitedByUserId: HOST,
      }),
    ).toThrow();
  });
});
