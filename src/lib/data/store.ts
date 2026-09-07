/**
 * In-memory application store.
 *
 * Data is seeded on first access and dies on process restart (cold start,
 * deploy, idle serverless). `supabase/schema.sql` exists but is not wired —
 * do not treat this as durable persistence. Demo login and trial signups
 * live here until a dedicated database pass.
 */
import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import {
  caseAttentionRank,
  caseIsOpen,
  caseIsOverdue,
  cleaningBucket,
} from "@/lib/ops-attention";
import { sv } from "date-fns/locale";
import {
  activity as seedActivity,
  attachments as seedAttachments,
  cases as seedCases,
  cleaners as seedCleaners,
  cleaningJobs as seedCleaningJobs,
  cleaningNotifications as seedCleaningNotifications,
  cleaningPhotos as seedCleaningPhotos,
  cleaningSchedules as seedCleaningSchedules,
  contractors as seedContractors,
  memberships as seedMemberships,
  messages as seedMessages,
  organization as seedOrganization,
  otherOrganization as seedOtherOrganization,
  profiles as seedProfiles,
  properties as seedProperties,
} from "@/lib/data/seed";
import {
  guideEvents as seedGuideEvents,
  places as seedPlaces,
  propertyGuides as seedPropertyGuides,
  propertyPlaces as seedPropertyPlaces,
} from "@/lib/data/guide-seed";
import { DEFAULT_CATEGORY_ORDER } from "@/lib/places";
import {
  canInviteRole,
  canAccessProperty,
  canOrderQrSign,
  membershipIsActive,
} from "@/lib/access/permissions";
import {
  decodeAccessTicket,
  encodeAccessTicket,
  isAccessTicketExpired,
} from "@/lib/access/tickets";
import {
  INCLUDED_QR_CODES,
  INVITE_TTL_HOURS,
  LOGIN_LINK_TTL_MINUTES,
  QR_SIGN_PRICE_EUR,
  TRIAL_DAYS,
  TRIAL_PROPERTY_LIMIT,
} from "@/lib/constants";
import { hashPassword, hashToken, verifyPassword } from "@/lib/crypto";
import {
  decodeSignupTicket,
  isSignupTicketExpired,
  type SignupTicket,
} from "@/lib/signup-ticket";
import {
  CASE_STATUSES,
  CLOSED_STATUSES,
  OPEN_STATUSES,
} from "@/lib/types";
import type {
  AccountType,
  ActivityLog,
  AdminNotice,
  Attachment,
  CaseFilters,
  CaseMessage,
  CaseNote,
  CasePriority,
  CaseSort,
  CaseStatus,
  CaseWithRelations,
  Notification,
  NotificationKind,
  OwnerAccess,
  PilotLead,
  CategoryDatum,
  Cleaner,
  CleaningChecklistItem,
  CleaningIssue,
  CleaningIssueKind,
  CleaningJob,
  CleaningJobWithRelations,
  CleaningNotification,
  CleaningPhoto,
  CleaningSchedule,
  CleaningStatus,
  Contractor,
  DashboardStats,
  GuideAnalytics,
  GuideEvent,
  GuideEventKind,
  InboxThread,
  Invitation,
  LocalizedText,
  LoginLink,
  MaintenanceCase,
  Membership,
  MonthDatum,
  Organization,
  Profile,
  Place,
  PlaceCategory,
  PropertyTraffic,
  PlaceMonetization,
  Property,
  PropertyEvent,
  PropertyFilters,
  PropertyGuide,
  PropertyHealth,
  PropertyPlace,
  PropertyPlaceWithPlace,
  PropertyWithMeta,
  QrSignOrder,
  RecurringIssue,
  StaffRole,
  UnitBand,
  UsageMetrics,
  VerificationToken,
} from "@/lib/types";
import { DEFAULT_CHECK_KEYS, DEFAULT_CHECK_LABELS } from "@/lib/cleaning";
import { createId, createToken, daysFromNow, nowIso } from "@/lib/utils";

interface StoreShape {
  organizations: Organization[];
  profiles: Profile[];
  properties: Property[];
  contractors: Contractor[];
  cases: MaintenanceCase[];
  attachments: Attachment[];
  messages: CaseMessage[];
  activity: ActivityLog[];
  verificationTokens: VerificationToken[];
  notices: AdminNotice[];
  verifyLinks: Record<string, string>;
  caseSeq: number;
  cleaners: Cleaner[];
  cleaningJobs: CleaningJob[];
  cleaningPhotos: CleaningPhoto[];
  cleaningIssues: CleaningIssue[];
  cleaningSchedules: CleaningSchedule[];
  cleaningNotifications: CleaningNotification[];
  propertyGuides: PropertyGuide[];
  places: Place[];
  propertyPlaces: PropertyPlace[];
  guideEvents: GuideEvent[];
  caseNotes: CaseNote[];
  notifications: Notification[];
  ownerAccess: OwnerAccess[];
  pilotLeads: PilotLead[];
  memberships: Membership[];
  invitations: Invitation[];
  loginLinks: LoginLink[];
  qrSignOrders: QrSignOrder[];
}

const globalForStore = globalThis as unknown as { __hqStore10?: StoreShape };

function getStore(): StoreShape {
  if (!globalForStore.__hqStore10) {
    globalForStore.__hqStore10 = createInitial();
  }
  return globalForStore.__hqStore10;
}

/** Test-only. Restores the seeded state so each test starts from a clean slate. */
export function resetStore() {
  globalForStore.__hqStore10 = createInitial();
}

function createInitial(): StoreShape {
  return {
    organizations: [structuredClone(seedOrganization), structuredClone(seedOtherOrganization)],
    profiles: structuredClone(seedProfiles),
    properties: structuredClone(seedProperties),
    contractors: structuredClone(seedContractors),
    cases: structuredClone(seedCases),
    attachments: structuredClone(seedAttachments),
    messages: structuredClone(seedMessages),
    activity: structuredClone(seedActivity),
    verificationTokens: [],
    notices: [],
    verifyLinks: {},
    caseSeq: 189,
    cleaners: structuredClone(seedCleaners),
    cleaningJobs: structuredClone(seedCleaningJobs),
    cleaningPhotos: structuredClone(seedCleaningPhotos),
    cleaningIssues: [],
    cleaningSchedules: structuredClone(seedCleaningSchedules),
    cleaningNotifications: structuredClone(seedCleaningNotifications),
    propertyGuides: structuredClone(seedPropertyGuides),
    places: structuredClone(seedPlaces),
    propertyPlaces: structuredClone(seedPropertyPlaces),
    guideEvents: structuredClone(seedGuideEvents),
    caseNotes: [],
    notifications: [],
    ownerAccess: [],
    pilotLeads: [],
    memberships: structuredClone(seedMemberships),
    invitations: [],
    loginLinks: [],
    qrSignOrders: [],
  };
}

function propertyHealth(
  open: MaintenanceCase[],
): PropertyHealth {
  if (open.some((item) => item.priority === "urgent")) return "critical";
  if (open.length > 0) return "attention";
  return "good";
}

function withMeta(property: Property): PropertyWithMeta {
  const store = getStore();
  const related = store.cases.filter((item) => item.propertyId === property.id);
  const open = related.filter((item) => OPEN_STATUSES.includes(item.status));
  const latest = [...related].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return {
    ...property,
    health: propertyHealth(open),
    openCaseCount: open.length,
    urgentCaseCount: open.filter((item) => item.priority === "urgent").length,
    totalCaseCount: related.length,
    latestCase: latest,
  };
}

function hydrateCase(item: MaintenanceCase): CaseWithRelations {
  const store = getStore();
  const property = store.properties.find((p) => p.id === item.propertyId);
  if (!property) {
    throw new Error("Fastigheten saknas");
  }
  const contractor = item.contractorId
    ? store.contractors.find((c) => c.id === item.contractorId)
    : undefined;
  return {
    ...item,
    property,
    contractor,
    attachments: store.attachments.filter((a) => a.caseId === item.id),
    messages: store.messages
      .filter((m) => m.caseId === item.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    activity: store.activity
      .filter((a) => a.caseId === item.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    notes: store.caseNotes
      .filter((n) => n.caseId === item.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

function nextReference(): string {
  const store = getStore();
  const year = new Date().getFullYear();
  const ref = `HQ-${year}-${String(store.caseSeq).padStart(4, "0")}`;
  store.caseSeq += 1;
  return ref;
}

function logActivity(
  caseId: string,
  type: ActivityLog["type"],
  actorName: string,
  text: string,
) {
  const store = getStore();
  const now = nowIso();
  store.activity.push({
    id: createId(),
    createdAt: now,
    updatedAt: now,
    caseId,
    type,
    actorName,
    text,
  });
}

export function getProfile(id: string) {
  return getStore().profiles.find((p) => p.id === id);
}

export function getProfileByEmail(email: string) {
  return getStore().profiles.find(
    (p) => p.email.toLowerCase() === email.trim().toLowerCase(),
  );
}

export function getOrganization(id: string) {
  return getStore().organizations.find((o) => o.id === id);
}

/**
 * Language used for notifications and activity text an organisation will read.
 * Taken from the first member, which is the manager who created the account.
 */
export function getOrganizationLocale(organizationId: string) {
  return (
    getStore().profiles.find((p) => p.organizationId === organizationId)?.locale ?? "sv"
  );
}

export function authenticate(email: string, password: string) {
  const profile = getProfileByEmail(email);
  if (!profile || !verifyPassword(password, profile.passwordHash)) return null;
  return profile;
}

export function registerTrialAccount(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountry: string;
  country: string;
  locale: string;
  unitBand: UnitBand;
  marketingConsent: boolean;
  organizationName: string;
  accountType: AccountType;
}) {
  if (getProfileByEmail(input.email)) {
    throw new Error("exists");
  }
  const store = getStore();
  const now = nowIso();
  const organizationId = createId();
  const profileId = createId();
  store.organizations.push({
    id: organizationId,
    createdAt: now,
    updatedAt: now,
    accountType: input.accountType,
    name: input.organizationName,
    supportEmail: input.email,
    supportPhone: input.phone,
    emergencyPhone: "112",
    plan: "trial",
    trialEndsAt: daysFromNow(TRIAL_DAYS),
    billed: false,
    qrAllowance: INCLUDED_QR_CODES,
  });
  const profile: Profile = {
    id: profileId,
    createdAt: now,
    updatedAt: now,
    organizationId,
    firstName: input.firstName,
    lastName: input.lastName,
    fullName: `${input.firstName} ${input.lastName}`.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone,
    phoneCountry: input.phoneCountry,
    country: input.country,
    locale: input.locale,
    unitBand: input.unitBand,
    marketingConsent: input.marketingConsent,
  };
  store.profiles.push(profile);
  ensureHostMembership(profile.id, organizationId);
  store.notices.push({
    id: createId(),
    createdAt: now,
    updatedAt: now,
    type: "signup",
    emailMasked: input.email.replace(/^(.).+(@.*)$/, "$1***$2"),
    companyName: input.organizationName,
    locale: input.locale,
  });
  return profile;
}

export function createVerificationToken(profileId: string, rawToken: string) {
  const store = getStore();
  const now = nowIso();
  for (const token of store.verificationTokens) {
    if (token.profileId === profileId && !token.usedAt) {
      token.usedAt = now;
    }
  }
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  store.verificationTokens.push({
    id: createId(),
    createdAt: now,
    updatedAt: now,
    profileId,
    tokenHash: hashToken(rawToken),
    expiresAt: expires,
  });
  store.verifyLinks[profileId] = rawToken;
}

export function peekDevVerifyToken(profileId: string) {
  return getStore().verifyLinks[profileId];
}

export function upsertTrialAccountFromTicket(ticket: SignupTicket) {
  const email = ticket.em.trim().toLowerCase();
  const existing = getProfile(ticket.pid) ?? getProfileByEmail(email);
  if (existing) return existing;

  const store = getStore();
  const now = nowIso();
  if (!getOrganization(ticket.oid)) {
    store.organizations.push({
      id: ticket.oid,
      createdAt: now,
      updatedAt: now,
      accountType: ticket.at,
      name: ticket.on,
      supportEmail: email,
      supportPhone: ticket.ph,
      emergencyPhone: "112",
      plan: "trial",
      trialEndsAt: daysFromNow(TRIAL_DAYS),
      billed: false,
      qrAllowance: INCLUDED_QR_CODES,
    });
  }
  const profile: Profile = {
    id: ticket.pid,
    createdAt: now,
    updatedAt: now,
    organizationId: ticket.oid,
    firstName: ticket.fn,
    lastName: ticket.ln,
    fullName: `${ticket.fn} ${ticket.ln}`.trim(),
    email,
    phone: ticket.ph,
    phoneCountry: ticket.pc,
    country: ticket.co,
    locale: ticket.lo,
    unitBand: ticket.ub,
    marketingConsent: ticket.mk,
  };
  store.profiles.push(profile);
  ensureHostMembership(profile.id, ticket.oid);
  return profile;
}

export function upsertAccountSnapshot(input: { profile: Profile; organization: Organization }) {
  const store = getStore();
  const now = nowIso();
  const existingOrg = getOrganization(input.organization.id);
  if (existingOrg) {
    Object.assign(existingOrg, input.organization, { updatedAt: now });
  } else {
    store.organizations.push({ ...input.organization, updatedAt: now });
  }
  const existingProfile = getProfile(input.profile.id);
  if (existingProfile) {
    Object.assign(existingProfile, input.profile, { updatedAt: now });
    ensureHostMembership(existingProfile.id, existingProfile.organizationId);
    return existingProfile;
  }
  const byEmail = getProfileByEmail(input.profile.email);
  if (byEmail && byEmail.id !== input.profile.id) return byEmail;
  store.profiles.push({ ...input.profile, updatedAt: now });
  const saved = getProfile(input.profile.id)!;
  ensureHostMembership(saved.id, saved.organizationId);
  return saved;
}

export function consumeVerificationToken(rawToken: string) {
  const ticket = decodeSignupTicket(rawToken);
  if (ticket) {
    if (isSignupTicketExpired(ticket)) return null;
    const profile = upsertTrialAccountFromTicket(ticket);
    const verifiedAt = profile.emailVerifiedAt ?? nowIso();
    profile.emailVerifiedAt = verifiedAt;
    profile.updatedAt = verifiedAt;
    const hashed = hashToken(rawToken);
    const stored = getStore().verificationTokens.find((item) => item.tokenHash === hashed);
    if (stored && !stored.usedAt) {
      stored.usedAt = verifiedAt;
      stored.updatedAt = verifiedAt;
    }
    return profile;
  }

  const store = getStore();
  const hashed = hashToken(rawToken);
  const now = Date.now();
  const token = store.verificationTokens.find((item) => item.tokenHash === hashed);
  if (!token) return null;
  const profile = getProfile(token.profileId);
  if (!profile) return null;
  if (!token.usedAt) {
    if (new Date(token.expiresAt).getTime() < now) return null;
    token.usedAt = nowIso();
    token.updatedAt = token.usedAt;
    profile.emailVerifiedAt = token.usedAt;
    profile.updatedAt = token.usedAt;
  }
  return profile;
}

export function bumpSessionVersion(profileId: string) {
  const profile = getProfile(profileId);
  if (!profile) return;
  profile.sessionVersion = (profile.sessionVersion ?? 0) + 1;
  profile.updatedAt = nowIso();
}

export function setProfilePassword(profileId: string, password: string) {
  const profile = getProfile(profileId);
  if (!profile) throw new Error("missing");
  profile.passwordHash = hashPassword(password);
  profile.sessionVersion = (profile.sessionVersion ?? 0) + 1;
  profile.updatedAt = nowIso();
  return profile;
}

export function createPasswordResetToken(profileId: string, rawToken: string) {
  const store = getStore();
  const now = nowIso();
  for (const token of store.verificationTokens) {
    if (token.profileId === profileId && token.purpose === "reset" && !token.usedAt) {
      token.usedAt = now;
    }
  }
  store.verificationTokens.push({
    id: createId(),
    createdAt: now,
    updatedAt: now,
    profileId,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    purpose: "reset",
  });
}

export function peekPasswordResetToken(rawToken: string) {
  const store = getStore();
  const hashed = hashToken(rawToken);
  const token = store.verificationTokens.find(
    (item) => item.tokenHash === hashed && item.purpose === "reset",
  );
  if (!token || token.usedAt) return null;
  if (new Date(token.expiresAt).getTime() < Date.now()) return null;
  return getProfile(token.profileId) ?? null;
}

export function consumePasswordResetToken(rawToken: string) {
  const profile = peekPasswordResetToken(rawToken);
  if (!profile) return null;
  const hashed = hashToken(rawToken);
  const token = getStore().verificationTokens.find((item) => item.tokenHash === hashed);
  if (token) {
    token.usedAt = nowIso();
    token.updatedAt = token.usedAt;
  }
  return profile;
}

export function updateSignupEmail(profileId: string, email: string) {
  if (getProfileByEmail(email)) throw new Error("exists");
  const profile = getProfile(profileId);
  if (!profile) throw new Error("missing");
  profile.email = email.trim().toLowerCase();
  profile.emailVerifiedAt = undefined;
  profile.updatedAt = nowIso();
  const org = getOrganization(profile.organizationId);
  if (org) org.supportEmail = profile.email;
  return profile;
}

export function completeOnboarding(profileId: string) {
  const profile = getProfile(profileId);
  if (!profile) return;
  profile.onboardingCompletedAt = nowIso();
  profile.updatedAt = profile.onboardingCompletedAt;
}

export function bookOnboarding(organizationId: string) {
  const org = getOrganization(organizationId);
  if (!org) return;
  org.onboardingBookedAt = nowIso();
  org.updatedAt = org.onboardingBookedAt;
}

export function addContractor(
  organizationId: string,
  input: Omit<Contractor, "id" | "createdAt" | "updatedAt" | "organizationId">,
) {
  const store = getStore();
  const now = nowIso();
  const contractor: Contractor = {
    ...input,
    id: createId(),
    createdAt: now,
    updatedAt: now,
    organizationId,
  };
  store.contractors.push(contractor);
  return contractor;
}

export function exportAccount(organizationId: string) {
  const store = getStore();
  return {
    organization: getOrganization(organizationId),
    profiles: store.profiles.filter((p) => p.organizationId === organizationId),
    properties: store.properties.filter((p) => p.organizationId === organizationId),
    contractors: store.contractors.filter((c) => c.organizationId === organizationId),
    cases: store.cases.filter((c) => c.organizationId === organizationId),
    cleaners: store.cleaners.filter((c) => c.organizationId === organizationId),
    cleaningJobs: store.cleaningJobs.filter((j) => j.organizationId === organizationId),
    propertyGuides: store.propertyGuides.filter((g) => g.organizationId === organizationId),
    places: store.places.filter((p) => p.organizationId === organizationId),
    propertyPlaces: store.propertyPlaces.filter((pp) => {
      const property = store.properties.find((p) => p.id === pp.propertyId);
      return property?.organizationId === organizationId;
    }),
    guideEvents: store.guideEvents.filter((e) => e.organizationId === organizationId),
    memberships: store.memberships.filter((m) => m.organizationId === organizationId),
    invitations: store.invitations.filter((i) => i.organizationId === organizationId),
  };
}

export function deleteAccount(organizationId: string) {
  const store = getStore();
  const caseIds = new Set(
    store.cases.filter((c) => c.organizationId === organizationId).map((c) => c.id),
  );
  const propertyIds = new Set(
    store.properties.filter((p) => p.organizationId === organizationId).map((p) => p.id),
  );
  const userIds = new Set(
    store.profiles.filter((p) => p.organizationId === organizationId).map((p) => p.id),
  );
  store.organizations = store.organizations.filter((o) => o.id !== organizationId);
  store.profiles = store.profiles.filter((p) => p.organizationId !== organizationId);
  store.properties = store.properties.filter((p) => p.organizationId !== organizationId);
  store.contractors = store.contractors.filter((c) => c.organizationId !== organizationId);
  store.cases = store.cases.filter((c) => c.organizationId !== organizationId);
  store.attachments = store.attachments.filter((a) => !caseIds.has(a.caseId));
  store.messages = store.messages.filter((m) => !caseIds.has(m.caseId));
  store.activity = store.activity.filter((a) => !caseIds.has(a.caseId));
  const jobIds = new Set(
    store.cleaningJobs.filter((j) => j.organizationId === organizationId).map((j) => j.id),
  );
  store.cleaners = store.cleaners.filter((c) => c.organizationId !== organizationId);
  store.cleaningJobs = store.cleaningJobs.filter((j) => j.organizationId !== organizationId);
  store.cleaningPhotos = store.cleaningPhotos.filter((p) => !jobIds.has(p.jobId));
  store.cleaningIssues = store.cleaningIssues.filter((i) => !jobIds.has(i.jobId));
  store.cleaningSchedules = store.cleaningSchedules.filter((s) => s.organizationId !== organizationId);
  store.cleaningNotifications = store.cleaningNotifications.filter(
    (n) => n.organizationId !== organizationId,
  );
  store.propertyGuides = store.propertyGuides.filter((g) => g.organizationId !== organizationId);
  store.places = store.places.filter((p) => p.organizationId !== organizationId);
  store.propertyPlaces = store.propertyPlaces.filter((pp) => !propertyIds.has(pp.propertyId));
  store.guideEvents = store.guideEvents.filter((e) => e.organizationId !== organizationId);
  store.memberships = store.memberships.filter((m) => m.organizationId !== organizationId);
  store.invitations = store.invitations.filter((i) => i.organizationId !== organizationId);
  store.loginLinks = store.loginLinks.filter((l) => !userIds.has(l.userId));
}

export function isPropertyCapLifted(org: Organization | undefined | null) {
  if (!org) return false;
  return org.billed || org.pilotComplete === true || org.plan === "pro";
}

export function propertyLimitFor(org: Organization | undefined | null): number | null {
  return isPropertyCapLifted(org) ? null : TRIAL_PROPERTY_LIMIT;
}

export function canAddProperty(organizationId: string) {
  const org = getOrganization(organizationId);
  const limit = propertyLimitFor(org);
  if (limit === null) return true;
  return listProperties(organizationId).length < limit;
}

export function isTrialActive(org: Organization | undefined | null) {
  if (!org || org.billed || org.pilotComplete || org.plan === "pro") return false;
  return org.plan === "trial";
}

export function trialDaysLeft(organizationId: string) {
  const org = getOrganization(organizationId);
  if (!isTrialActive(org) || !org?.trialEndsAt) return null;
  const ms = new Date(org.trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function isTrialEnded(organizationId: string) {
  const org = getOrganization(organizationId);
  if (!isTrialActive(org) || !org?.trialEndsAt) return false;
  return new Date(org.trialEndsAt).getTime() <= Date.now();
}

export function savePayPerHomeMonth(organizationId: string, value: string) {
  const org = getOrganization(organizationId);
  if (!org) throw new Error("Organisationen hittades inte");
  const trimmed = value.trim().slice(0, 32);
  org.payPerHomeMonth = trimmed || undefined;
  org.updatedAt = nowIso();
  return org;
}

export function registerAccount(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  organizationName: string;
  accountType?: AccountType;
}) {
  const [firstName, ...rest] = input.fullName.split(" ");
  return registerTrialAccount({
    accountType: input.accountType ?? "company",
    firstName: firstName || input.fullName,
    lastName: rest.join(" "),
    email: input.email,
    phone: input.phone,
    phoneCountry: "SE",
    country: "SE",
    locale: "sv",
    unitBand: "1-5",
    marketingConsent: false,
    organizationName: input.organizationName,
  });
}

export function listProperties(
  organizationId: string,
  filters: PropertyFilters = {},
): PropertyWithMeta[] {
  const store = getStore();
  let items = store.properties
    .filter((p) => p.organizationId === organizationId)
    .map(withMeta);

  if (filters.country && filters.country !== "all") {
    items = items.filter((p) => p.country === filters.country);
  }
  if (filters.city && filters.city !== "all") {
    items = items.filter((p) => p.city === filters.city);
  }
  if (filters.health && filters.health !== "all") {
    items = items.filter((p) => p.health === filters.health);
  }
  if (filters.query) {
    const q = filters.query.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.tenantName.toLowerCase().includes(q),
    );
  }

  return items.sort((a, b) => a.name.localeCompare(b.name, "sv"));
}

export function getProperty(organizationId: string, id: string) {
  const property = getStore().properties.find(
    (p) => p.id === id && p.organizationId === organizationId,
  );
  return property ? withMeta(property) : undefined;
}

export function getPropertyByToken(token: string) {
  const property = getStore().properties.find((p) => p.reportToken === token);
  if (!property) return undefined;
  if (!guestLinkIsOpen(property)) return undefined;
  return withMeta(property);
}

export function propertyFilterOptions(organizationId: string) {
  const items = listProperties(organizationId);
  return {
    countries: [...new Set(items.map((p) => p.country))].sort(),
    cities: [...new Set(items.map((p) => p.city))].sort(),
  };
}

export function createProperty(
  organizationId: string,
  input: Omit<
    Property,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "organizationId"
    | "reportToken"
    | "documents"
    | "inspectionPhotos"
  > & { documents?: Property["documents"]; inspectionPhotos?: Property["inspectionPhotos"] },
) {
  if (!canAddProperty(organizationId)) {
    throw new Error("property_limit");
  }
  const store = getStore();
  const now = nowIso();
  const property: Property = {
    ...input,
    id: createId(),
    createdAt: now,
    updatedAt: now,
    organizationId,
    reportToken: createToken("qr"),
    documents: input.documents ?? [],
    inspectionPhotos: input.inspectionPhotos ?? [],
  };
  store.properties.push(property);
  ensurePropertyGuide(property);
  return withMeta(property);
}

export function updateProperty(
  organizationId: string,
  id: string,
  patch: Partial<
    Pick<
      Property,
      | "name"
      | "address"
      | "city"
      | "country"
      | "countryCode"
      | "imageUrl"
      | "type"
      | "sqm"
      | "rooms"
      | "tenantName"
      | "tenantEmail"
      | "tenantPhone"
      | "notes"
      | "lat"
      | "lng"
    >
  >,
) {
  const property = getStore().properties.find(
    (item) => item.id === id && item.organizationId === organizationId,
  );
  if (!property) throw new Error("Bostaden hittades inte");
  Object.assign(property, patch, { updatedAt: nowIso() });
  return withMeta(property);
}

/**
 * Issues a new QR token. Any printed code or link using the old token stops
 * working immediately, which is the point: it is how a manager locks out a
 * QR sticker that has been photographed or left behind.
 */
export function rotatePropertyToken(organizationId: string, propertyId: string) {
  const property = getStore().properties.find(
    (p) => p.id === propertyId && p.organizationId === organizationId,
  );
  if (!property) throw new Error("Bostaden hittades inte");
  property.reportToken = createToken("qr");
  property.guestLinkRevokedAt = undefined;
  property.updatedAt = nowIso();
  return property.reportToken;
}

/**
 * Guest-safe fields for the public print sign. Never include notes, tenant
 * contact, owner access or case internals.
 */
export function getPublicQrSign(token: string) {
  const property = getPropertyByToken(token);
  if (!property) return undefined;
  return {
    name: property.name,
    address: property.address,
    city: property.city,
    reportToken: property.reportToken,
  };
}

export function listQrSignOrders(organizationId: string, propertyId?: string) {
  return getStore()
    .qrSignOrders.filter(
      (order) =>
        order.organizationId === organizationId &&
        (!propertyId || order.propertyId === propertyId),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getOpenQrSignOrder(organizationId: string, propertyId: string) {
  return listQrSignOrders(organizationId, propertyId).find((order) => order.status === "open");
}

export function placeQrSignOrder(input: {
  membership: Membership | null | undefined;
  propertyId: string;
  shippingName: string;
  shippingAddress: string;
  shippingPostalCode: string;
  shippingCity: string;
  shippingPhone: string;
  shippingEmail: string;
  orderedByProfileId: string;
}): QrSignOrder {
  if (!canOrderQrSign(input.membership, input.propertyId)) {
    throw new Error("forbidden");
  }
  const property = getProperty(input.membership.organizationId, input.propertyId);
  if (!property) throw new Error("forbidden");
  const store = getStore();
  const now = nowIso();
  const order: QrSignOrder = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    organizationId: input.membership.organizationId,
    propertyId: property.id,
    qrToken: property.reportToken,
    status: "open",
    priceEur: QR_SIGN_PRICE_EUR,
    shippingName: input.shippingName,
    shippingAddress: input.shippingAddress,
    shippingPostalCode: input.shippingPostalCode,
    shippingCity: input.shippingCity,
    shippingPhone: input.shippingPhone,
    shippingEmail: input.shippingEmail,
    orderedByProfileId: input.orderedByProfileId,
  };
  store.qrSignOrders.push(order);
  return order;
}

export function listContractors(organizationId: string) {
  return getStore()
    .contractors.filter((c) => c.organizationId === organizationId)
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
}

export function listCases(
  organizationId: string,
  filters: CaseFilters = {},
): CaseWithRelations[] {
  const store = getStore();
  let items = store.cases.filter((c) => c.organizationId === organizationId);

  if (filters.status && filters.status !== "all") {
    items = items.filter((c) => c.status === filters.status);
  }
  if (filters.priority && filters.priority !== "all") {
    items = items.filter((c) => c.priority === filters.priority);
  }
  if (filters.propertyId && filters.propertyId !== "all") {
    items = items.filter((c) => c.propertyId === filters.propertyId);
  }
  if (filters.category && filters.category !== "all") {
    items = items.filter((c) => c.category === filters.category);
  }
  if (filters.query) {
    const q = filters.query.toLowerCase();
    items = items.filter((c) => {
      const property = store.properties.find((p) => p.id === c.propertyId);
      const contractor = store.contractors.find((item) => item.id === c.contractorId);
      return (
        c.reference.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.reporterName.toLowerCase().includes(q) ||
        property?.name.toLowerCase().includes(q) ||
        (contractor?.name ?? "").toLowerCase().includes(q)
      );
    });
  }

  const sort: CaseSort = filters.sort ?? "date";
  const priorityRank: Record<CasePriority, number> = {
    urgent: 0,
    soon: 1,
    normal: 2,
    low: 3,
  };
  const statusRank = Object.fromEntries(CASE_STATUSES.map((status, index) => [status, index])) as Record<
    CaseStatus,
    number
  >;

  return items
    .sort((a, b) => {
      if (sort === "priority") {
        const diff = priorityRank[a.priority] - priorityRank[b.priority];
        if (diff) return diff;
      } else if (sort === "status") {
        const diff = statusRank[a.status] - statusRank[b.status];
        if (diff) return diff;
      } else {
        const diff = caseAttentionRank(a) - caseAttentionRank(b);
        if (diff) return diff;
      }
      return b.createdAt.localeCompare(a.createdAt);
    })
    .map(hydrateCase);
}

export function getCase(organizationId: string, id: string) {
  const item = getStore().cases.find(
    (c) => c.id === id && c.organizationId === organizationId,
  );
  return item ? hydrateCase(item) : undefined;
}

export function getCaseByTrackToken(token: string) {
  const item = getStore().cases.find((c) => c.trackToken === token);
  return item ? hydrateCase(item) : undefined;
}

export function getDashboardStats(organizationId: string): DashboardStats {
  const properties = listProperties(organizationId);
  const cases = listCases(organizationId);
  const monthStart = startOfMonth(new Date()).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const inRange = (iso: string, from: string, to: string) => iso >= from && iso < to;
  const flowDelta = (predicate: (item: (typeof cases)[number]) => boolean, dateOf: (item: (typeof cases)[number]) => string) => {
    const recent = cases.filter((item) => predicate(item) && inRange(dateOf(item), weekAgo, "9999")).length;
    const previous = cases.filter((item) => predicate(item) && inRange(dateOf(item), twoWeeksAgo, weekAgo)).length;
    return recent - previous;
  };

  return {
    propertyCount: properties.length,
    newCases: cases.filter((c) => c.status === "new").length,
    openCases: cases.filter((c) => OPEN_STATUSES.includes(c.status)).length,
    resolvedThisMonth: cases.filter(
      (c) => CLOSED_STATUSES.includes(c.status) && (c.completedAt ?? c.updatedAt) >= monthStart,
    ).length,
    urgentCases: cases.filter(
      (c) => c.priority === "urgent" && OPEN_STATUSES.includes(c.status),
    ).length,
    deltas: {
      propertyCount:
        properties.filter((p) => p.createdAt >= weekAgo).length -
        properties.filter((p) => inRange(p.createdAt, twoWeeksAgo, weekAgo)).length,
      newCases: flowDelta((c) => c.status === "new", (c) => c.createdAt),
      openCases: flowDelta((c) => OPEN_STATUSES.includes(c.status), (c) => c.createdAt),
      resolvedThisMonth: flowDelta(
        (c) => CLOSED_STATUSES.includes(c.status),
        (c) => c.completedAt ?? c.updatedAt,
      ),
      urgentCases: flowDelta(
        (c) => c.priority === "urgent" && OPEN_STATUSES.includes(c.status),
        (c) => c.createdAt,
      ),
    },
  };
}

export function getUsageMetrics(organizationId: string): UsageMetrics {
  const store = getStore();
  const properties = listProperties(organizationId);
  const cases = listCases(organizationId);
  const org = getOrganization(organizationId);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const closed = cases.filter(
    (item) =>
      CLOSED_STATUSES.includes(item.status) &&
      item.completedAt &&
      item.completedAt >= since,
  );
  const hours = closed.map(
    (item) => (Date.parse(item.completedAt!) - Date.parse(item.createdAt)) / 3_600_000,
  );
  const avg = hours.length ? hours.reduce((sum, value) => sum + value, 0) / hours.length : null;
  const events = store.guideEvents.filter(
    (item) => item.organizationId === organizationId && item.createdAt >= since,
  );
  const cleanings = store.cleaningJobs.filter(
    (job) =>
      job.organizationId === organizationId &&
      (job.status === "completed" || job.status === "approved") &&
      (job.completedAt ?? job.updatedAt) >= since,
  );
  const wifiCopies = events.filter((item) => item.kind === "click_wifi").length;
  const scans = events.filter((item) => item.kind === "scan").length;
  return {
    scans,
    reports: cases.filter((item) => item.createdAt >= since).length,
    avgResolutionHours: avg === null ? null : Math.round(avg * 10) / 10,
    cleaningsCompleted: cleanings.length,
    handledCases: closed.length,
    wifiCopies,
    guideViews: scans,
    propertiesCreated: properties.length,
    propertiesWithWifi: properties.filter((property) => Boolean(getPropertyGuide(property.id)?.wifiName))
      .length,
    trial: isTrialActive(org),
    billed: Boolean(org?.billed),
  };
}

export function getAttentionProperties(organizationId: string) {
  return listProperties(organizationId)
    .filter((p) => p.health !== "good")
    .sort((a, b) => b.urgentCaseCount - a.urgentCaseCount || b.openCaseCount - a.openCaseCount);
}

export function getHostAttention(organizationId: string) {
  const properties = listProperties(organizationId);
  const cases = listCases(organizationId);
  const jobs = listCleaningJobs(organizationId);
  const open = cases.filter((item) => caseIsOpen(item.status));
  const urgent = open.filter((item) => item.priority === "urgent");
  const unassigned = open.filter((item) => !item.contractorId);
  const overdueCases = open.filter((item) => caseIsOverdue(item));
  const notReady = properties.filter((property) => !property.guestReady);
  const needsAction = properties.filter(
    (property) => property.health !== "good" || !property.guestReady,
  );
  const todayJobs = jobs.filter((job) => cleaningBucket(job) === "today");
  const overdueJobs = jobs.filter((job) => cleaningBucket(job) === "overdue");
  return {
    urgent,
    unassigned,
    overdueCases,
    notReady,
    needsAction,
    todayJobs,
    overdueJobs,
    recent: [...cases]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5),
  };
}

export function getMonthSeries(organizationId: string): MonthDatum[] {
  const cases = getStore().cases.filter((c) => c.organizationId === organizationId);
  const points: MonthDatum[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const date = subMonths(startOfMonth(new Date()), i);
    const key = format(date, "yyyy-MM");
    const reported = cases.filter((c) => c.createdAt.startsWith(key)).length;
    const resolved = cases.filter(
      (c) => CLOSED_STATUSES.includes(c.status) && (c.completedAt ?? "").startsWith(key),
    ).length;
    points.push({
      month: key,
      label: format(date, "MMM", { locale: sv }).replace(".", ""),
      reported,
      resolved,
    });
  }
  return points;
}

export function getCategoryBreakdown(organizationId: string): CategoryDatum[] {
  const cases = getStore().cases.filter((c) => c.organizationId === organizationId);
  const counts = new Map<CategoryDatum["category"], number>();
  for (const item of cases) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export function getRecurringIssues(organizationId: string): RecurringIssue[] {
  const cases = listCases(organizationId);
  const map = new Map<string, RecurringIssue>();
  for (const item of cases) {
    const key = `${item.propertyId}:${item.category}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        propertyId: item.propertyId,
        propertyName: item.property.name,
        category: item.category,
        count: 1,
      });
    }
  }
  return [...map.values()].filter((item) => item.count >= 2).sort((a, b) => b.count - a.count);
}

export function getInbox(organizationId: string): InboxThread[] {
  const cases = listCases(organizationId);
  return cases
    .map((item) => {
      const last = [...item.messages].pop();
      if (!last) return null;
      return {
        caseId: item.id,
        reference: item.reference,
        propertyName: item.property.name,
        lastMessage: last,
        unread: !last.readByOwner && last.author !== "owner",
      } satisfies InboxThread;
    })
    .filter((item): item is InboxThread => Boolean(item))
    .sort((a, b) => b.lastMessage.createdAt.localeCompare(a.lastMessage.createdAt));
}

export function unreadCount(organizationId: string) {
  return getInbox(organizationId).filter((t) => t.unread).length;
}

export function getPropertyTimeline(organizationId: string, propertyId: string): PropertyEvent[] {
  const property = getProperty(organizationId, propertyId);
  if (!property) return [];
  const cases = listCases(organizationId).filter((c) => c.propertyId === propertyId);
  const events: PropertyEvent[] = [
    {
      id: `lease-${property.id}`,
      at: property.leaseStart,
      title: "Hyresperiod startade",
      text: `${property.tenantName} flyttade in`,
      kind: "lease",
    },
    {
      id: `insp-${property.id}`,
      at: property.lastInspection,
      title: "Tillsyn genomförd",
      text: "Senaste kontrollen av bostaden",
      kind: "inspection",
    },
  ];
  for (const item of cases) {
    events.push({
      id: `case-${item.id}`,
      at: item.createdAt,
      title: `Felanmälan ${item.reference}`,
      text: item.title,
      kind: "case",
    });
    if (item.completedAt) {
      events.push({
        id: `res-${item.id}`,
        at: item.completedAt,
        title: `${item.reference} löst`,
        text: item.title,
        kind: "resolved",
      });
    }
  }
  return events.sort((a, b) => b.at.localeCompare(a.at));
}

export function submitReport(input: {
  propertyToken: string;
  category: MaintenanceCase["category"];
  priority: MaintenanceCase["priority"];
  title: string;
  description: string;
  discoveredAt: string;
  stillOngoing: boolean;
  reporterName: string;
  reporterPhone: string;
  reporterEmail: string;
  photos: { url: string; caption?: string }[];
  locale?: string;
}) {
  const property = getPropertyByToken(input.propertyToken);
  if (!property) throw new Error("Fastigheten hittades inte");
  const store = getStore();
  const now = nowIso();
  const id = createId();
  const item: MaintenanceCase = {
    id,
    createdAt: now,
    updatedAt: now,
    organizationId: property.organizationId,
    reference: nextReference(),
    propertyId: property.id,
    category: input.category,
    priority: input.priority,
    status: "new",
    title: input.title,
    description: input.description,
    discoveredAt: input.discoveredAt || now,
    stillOngoing: input.stillOngoing,
    reporterName: input.reporterName,
    reporterPhone: input.reporterPhone,
    reporterEmail: input.reporterEmail,
    trackToken: createToken("tr"),
  };
  store.cases.push(item);
  for (const photo of input.photos) {
    store.attachments.push({
      id: createId(),
      createdAt: now,
      updatedAt: now,
      caseId: id,
      kind: "reported",
      url: photo.url,
      caption: photo.caption,
    });
  }
  logActivity(id, "case_created", input.reporterName, "Felanmälan skapades");
  if (input.photos.length) {
    logActivity(id, "photos_added", input.reporterName, `${input.photos.length} bilder bifogades`);
  }
  addMessage({
    caseId: id,
    organizationId: property.organizationId,
    author: "tenant",
    authorName: input.reporterName,
    text: input.description,
    locale: input.locale,
  });
  return hydrateCase(item);
}

export function createManagerCase(input: {
  organizationId: string;
  propertyId: string;
  category: MaintenanceCase["category"];
  priority: MaintenanceCase["priority"];
  title: string;
  description: string;
  reporterName: string;
}) {
  const store = getStore();
  const property = store.properties.find(
    (p) => p.id === input.propertyId && p.organizationId === input.organizationId,
  );
  if (!property) throw new Error("Fastigheten hittades inte");
  const now = nowIso();
  const id = createId();
  const item: MaintenanceCase = {
    id,
    createdAt: now,
    updatedAt: now,
    organizationId: input.organizationId,
    reference: nextReference(),
    propertyId: property.id,
    category: input.category,
    priority: input.priority,
    status: "new",
    title: input.title,
    description: input.description,
    discoveredAt: now,
    stillOngoing: true,
    reporterName: input.reporterName,
    reporterPhone: "",
    reporterEmail: "",
    trackToken: createToken("tr"),
  };
  store.cases.push(item);
  logActivity(id, "case_created", input.reporterName, "Ärendet skapades");
  addMessage({
    caseId: id,
    organizationId: input.organizationId,
    author: "owner",
    authorName: input.reporterName,
    text: input.description,
  });
  return hydrateCase(item);
}

/**
 * `label` is the already-translated status name. Activity text is stored as
 * written, so the caller passes the label in the organisation's language
 * rather than the store reaching for a dictionary.
 */
export function updateCaseStatus(
  organizationId: string,
  caseId: string,
  status: MaintenanceCase["status"],
  actorName: string,
  label?: string,
) {
  const store = getStore();
  const item = store.cases.find(
    (c) => c.id === caseId && c.organizationId === organizationId,
  );
  if (!item) throw new Error("Ärendet hittades inte");
  const now = nowIso();
  item.status = status;
  item.updatedAt = now;
  if (status === "resolved" || status === "approved") {
    item.completedAt = item.completedAt ?? now;
  }
  if (status === "resolved") {
    logActivity(caseId, "marked_resolved", actorName, "Ärendet markerades som klart");
  } else {
    logActivity(
      caseId,
      "status_changed",
      actorName,
      `Status: ${label ?? status}`,
    );
  }
  return hydrateCase(item);
}

export function assignContractor(
  organizationId: string,
  caseId: string,
  contractorId: string | undefined,
  actorName: string,
) {
  const store = getStore();
  const item = store.cases.find(
    (c) => c.id === caseId && c.organizationId === organizationId,
  );
  if (!item) throw new Error("Ärendet hittades inte");
  const contractor = contractorId
    ? store.contractors.find((c) => c.id === contractorId)
    : undefined;
  item.contractorId = contractorId;
  item.updatedAt = nowIso();
  if (contractor && item.status === "new") {
    item.status = "assigned";
  }
  logActivity(
    caseId,
    "contractor_assigned",
    actorName,
    contractor ? `Tilldelad ${contractor.name}` : "Tilldelning togs bort",
  );
  return hydrateCase(item);
}

export function addMessage(input: {
  caseId: string;
  organizationId?: string;
  trackToken?: string;
  author: CaseMessage["author"];
  authorName: string;
  text: string;
  locale?: string;
}) {
  const store = getStore();
  const item = input.organizationId
    ? store.cases.find(
        (c) => c.id === input.caseId && c.organizationId === input.organizationId,
      )
    : store.cases.find(
        (c) => c.id === input.caseId && c.trackToken === input.trackToken,
      );
  if (!item) throw new Error("Ärendet hittades inte");
  const now = nowIso();
  const message: CaseMessage = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    caseId: item.id,
    author: input.author,
    authorName: input.authorName,
    text: input.text.trim(),
    originalText: input.text.trim(),
    originalLocale: input.locale ?? "sv",
    translated: false,
    readByOwner: input.author === "owner",
  };
  store.messages.push(message);
  item.updatedAt = now;
  logActivity(item.id, "message_sent", input.authorName, "Nytt meddelande");
  return hydrateCase(item);
}

export function markInboxRead(organizationId: string, caseId: string) {
  const store = getStore();
  const item = store.cases.find(
    (c) => c.id === caseId && c.organizationId === organizationId,
  );
  if (!item) return;
  for (const message of store.messages) {
    if (message.caseId === caseId) message.readByOwner = true;
  }
}

export function addAfterPhotos(
  organizationId: string,
  caseId: string,
  photos: { url: string; caption?: string }[],
  actorName: string,
) {
  const store = getStore();
  const item = store.cases.find(
    (c) => c.id === caseId && c.organizationId === organizationId,
  );
  if (!item) throw new Error("Ärendet hittades inte");
  const now = nowIso();
  for (const photo of photos) {
    store.attachments.push({
      id: createId(),
      createdAt: now,
      updatedAt: now,
      caseId,
      kind: "after",
      url: photo.url,
      caption: photo.caption,
    });
  }
  item.updatedAt = now;
  logActivity(caseId, "photos_added", actorName, `${photos.length} efterbilder lades till`);
  return hydrateCase(item);
}

export function tenantConfirm(trackToken: string, actorName: string) {
  const store = getStore();
  const item = store.cases.find((c) => c.trackToken === trackToken);
  if (!item) throw new Error("Ärendet hittades inte");
  const now = nowIso();
  item.tenantConfirmedAt = now;
  item.updatedAt = now;
  if (item.status !== "resolved") {
    item.status = "resolved";
    item.completedAt = now;
  }
  logActivity(
    item.id,
    "tenant_confirmed",
    actorName,
    "Hyresgästen bekräftade att problemet är löst",
  );
  return hydrateCase(item);
}

export function updateOrganization(
  organizationId: string,
  patch: Partial<
    Pick<
      Organization,
      | "name"
      | "supportEmail"
      | "supportPhone"
      | "emergencyPhone"
      | "payPerHomeMonth"
      | "pilotComplete"
      | "billed"
      | "plan"
    >
  >,
) {
  const org = getOrganization(organizationId);
  if (!org) throw new Error("Organisationen hittades inte");
  Object.assign(org, patch, { updatedAt: nowIso() });
  return org;
}

export function updateProfile(
  profileId: string,
  patch: Partial<
    Pick<
      Profile,
      | "fullName"
      | "phone"
      | "email"
      | "locale"
      | "marketingConsent"
      | "notifyCases"
      | "notifyCleaning"
      | "notifyUrgent"
    >
  >,
) {
  const profile = getProfile(profileId);
  if (!profile) throw new Error("Profilen hittades inte");
  Object.assign(profile, patch, { updatedAt: nowIso() });
  return profile;
}

export function propertyCases(organizationId: string, propertyId: string) {
  return listCases(organizationId).filter((c) => c.propertyId === propertyId);
}

export function formatDiscovered(value: string) {
  return parseISO(value).toISOString();
}

function hydrateCleaningJob(job: CleaningJob): CleaningJobWithRelations {
  const store = getStore();
  const property = store.properties.find((p) => p.id === job.propertyId);
  if (!property) throw new Error("Fastigheten saknas");
  const cleaner = job.cleanerId
    ? store.cleaners.find((c) => c.id === job.cleanerId)
    : undefined;
  return {
    ...job,
    property,
    cleaner,
    photos: store.cleaningPhotos
      .filter((p) => p.jobId === job.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    issues: store.cleaningIssues
      .filter((i) => i.jobId === job.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

function makeChecklist(labels: Record<string, string>): CleaningChecklistItem[] {
  return DEFAULT_CHECK_KEYS.map((key) => ({
    id: createId(),
    key,
    label: labels[key] ?? DEFAULT_CHECK_LABELS[key] ?? key,
    done: false,
  }));
}

export function listCleaners(organizationId: string) {
  return getStore()
    .cleaners.filter((c) => c.organizationId === organizationId)
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
}

export function addCleaner(
  organizationId: string,
  input: Omit<Cleaner, "id" | "createdAt" | "updatedAt" | "organizationId">,
) {
  const store = getStore();
  const now = nowIso();
  const cleaner: Cleaner = {
    ...input,
    id: createId(),
    createdAt: now,
    updatedAt: now,
    organizationId,
  };
  store.cleaners.push(cleaner);
  return cleaner;
}

function generateDueCleaningJobs(organizationId: string) {
  const store = getStore();
  const now = Date.now();
  for (const schedule of store.cleaningSchedules) {
    if (!schedule.active || schedule.organizationId !== organizationId) continue;
    const property = store.properties.find((p) => p.id === schedule.propertyId);
    if (!property?.nextCheckoutAt) continue;
    const checkout = new Date(property.nextCheckoutAt).getTime();
    const due = checkout + schedule.offsetHours * 60 * 60 * 1000;
    if (due > now) continue;
    const exists = store.cleaningJobs.some(
      (job) =>
        job.scheduleId === schedule.id && job.guestCheckoutAt === property.nextCheckoutAt,
    );
    if (exists) continue;
    const labels: Record<string, string> = {};
    createCleaningJob({
      organizationId,
      propertyId: property.id,
      cleanerId: schedule.cleanerId,
      scheduledAt: new Date(due).toISOString(),
      instructions: schedule.instructions,
      labels,
      guestCheckoutAt: property.nextCheckoutAt,
      scheduleId: schedule.id,
    });
  }
}

export function listCleaningJobs(organizationId: string) {
  generateDueCleaningJobs(organizationId);
  return getStore()
    .cleaningJobs.filter((j) => j.organizationId === organizationId)
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
    .map(hydrateCleaningJob);
}

export function getCleaningJob(organizationId: string, id: string) {
  const job = getStore().cleaningJobs.find(
    (j) => j.id === id && j.organizationId === organizationId,
  );
  return job ? hydrateCleaningJob(job) : undefined;
}

export function getCleaningJobByToken(token: string) {
  const job = getStore().cleaningJobs.find((j) => j.accessToken === token);
  return job ? hydrateCleaningJob(job) : undefined;
}

export function listCleaningSchedules(organizationId: string) {
  return getStore().cleaningSchedules.filter((s) => s.organizationId === organizationId);
}

export function listCleaningNotifications(organizationId: string) {
  return getStore()
    .cleaningNotifications.filter((n) => n.organizationId === organizationId && !n.read)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createCleaningJob(input: {
  organizationId: string;
  propertyId: string;
  cleanerId?: string;
  scheduledAt: string;
  instructions: string;
  labels: Record<string, string>;
  guestCheckoutAt?: string;
  scheduleId?: string;
}) {
  const store = getStore();
  const property = store.properties.find(
    (p) => p.id === input.propertyId && p.organizationId === input.organizationId,
  );
  if (!property) throw new Error("Fastigheten saknas");
  const now = nowIso();
  const job: CleaningJob = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    organizationId: input.organizationId,
    propertyId: input.propertyId,
    cleanerId: input.cleanerId,
    accessToken: createToken("cln"),
    status: "scheduled",
    scheduledAt: input.scheduledAt || now,
    instructions: input.instructions.trim(),
    checklist: makeChecklist(input.labels),
    guestCheckoutAt: input.guestCheckoutAt,
    scheduleId: input.scheduleId,
  };
  store.cleaningJobs.push(job);
  property.guestReady = false;
  property.updatedAt = now;
  return hydrateCleaningJob(job);
}

export function upsertCleaningSchedule(input: {
  organizationId: string;
  propertyId: string;
  cleanerId?: string;
  offsetHours: number;
  instructions: string;
}) {
  const store = getStore();
  const now = nowIso();
  const existing = store.cleaningSchedules.find(
    (s) => s.organizationId === input.organizationId && s.propertyId === input.propertyId,
  );
  if (existing) {
    Object.assign(existing, {
      cleanerId: input.cleanerId,
      offsetHours: input.offsetHours,
      instructions: input.instructions.trim(),
      afterCheckout: true,
      active: true,
      updatedAt: now,
    });
    return existing;
  }
  const schedule: CleaningSchedule = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    organizationId: input.organizationId,
    propertyId: input.propertyId,
    cleanerId: input.cleanerId,
    afterCheckout: true,
    offsetHours: input.offsetHours,
    instructions: input.instructions.trim(),
    active: true,
  };
  store.cleaningSchedules.push(schedule);
  return schedule;
}

export function updateCleaningStatus(tokenOrId: string, status: CleaningStatus, byToken = false) {
  const store = getStore();
  const job = byToken
    ? store.cleaningJobs.find((j) => j.accessToken === tokenOrId)
    : store.cleaningJobs.find((j) => j.id === tokenOrId);
  if (!job) throw new Error("Uppdraget hittades inte");
  const now = nowIso();
  job.status = status;
  job.updatedAt = now;
  const property = store.properties.find((p) => p.id === job.propertyId);
  if (status === "in_progress") {
    job.startedAt = job.startedAt ?? now;
    if (property) {
      property.guestReady = false;
      property.updatedAt = now;
    }
  }
  if (status === "completed") {
    job.completedAt = now;
    if (job.startedAt && job.minutesWorked == null) {
      job.minutesWorked = Math.max(
        1,
        Math.round((Date.parse(now) - Date.parse(job.startedAt)) / 60_000),
      );
    }
    if (property) {
      property.guestReady = true;
      property.updatedAt = now;
    }
    store.cleaningNotifications.push({
      id: createId(),
      createdAt: now,
      updatedAt: now,
      organizationId: job.organizationId,
      jobId: job.id,
      propertyName: property?.name ?? "",
      read: false,
    });
  }
  return hydrateCleaningJob(job);
}

export function recordCleaningMinutes(token: string, minutes: number) {
  const job = getStore().cleaningJobs.find((item) => item.accessToken === token);
  if (!job) throw new Error("Uppdraget hittades inte");
  const value = Math.round(minutes);
  if (!Number.isFinite(value) || value < 0 || value > 24 * 60) {
    throw new Error("time");
  }
  job.minutesWorked = value;
  job.updatedAt = nowIso();
  return hydrateCleaningJob(job);
}

export function toggleCleaningItem(token: string, itemId: string, done: boolean) {
  const job = getStore().cleaningJobs.find((j) => j.accessToken === token);
  if (!job) throw new Error("Uppdraget hittades inte");
  const item = job.checklist.find((c) => c.id === itemId);
  if (!item) throw new Error("Punkten saknas");
  item.done = done;
  item.doneAt = done ? nowIso() : undefined;
  job.updatedAt = nowIso();
  return hydrateCleaningJob(job);
}

export function addCleaningPhotos(
  token: string,
  photos: { url: string; kind: "before" | "after"; caption?: string }[],
) {
  const store = getStore();
  const job = store.cleaningJobs.find((j) => j.accessToken === token);
  if (!job) throw new Error("Uppdraget hittades inte");
  const now = nowIso();
  for (const photo of photos) {
    store.cleaningPhotos.push({
      id: createId(),
      createdAt: now,
      updatedAt: now,
      jobId: job.id,
      kind: photo.kind,
      url: photo.url,
      caption: photo.caption,
    });
  }
  job.updatedAt = now;
  return hydrateCleaningJob(job);
}

export function reportCleaningIssue(input: {
  token: string;
  kind: CleaningIssueKind;
  text: string;
  convert: boolean;
  reporterName: string;
}) {
  const store = getStore();
  const job = store.cleaningJobs.find((j) => j.accessToken === input.token);
  if (!job) throw new Error("Uppdraget hittades inte");
  const property = store.properties.find((p) => p.id === job.propertyId);
  if (!property) throw new Error("Fastigheten saknas");
  const now = nowIso();
  const issue: CleaningIssue = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    jobId: job.id,
    kind: input.kind,
    text: input.text.trim(),
  };
  if (input.convert) {
    const created = submitReport({
      propertyToken: property.reportToken,
      category: "other",
      priority: "soon",
      title: input.text.trim().slice(0, 80) || "Rapport från städning",
      description: `Rapporterat vid städning av ${property.name}: ${input.text.trim()}`,
      discoveredAt: now,
      stillOngoing: true,
      reporterName: input.reporterName,
      reporterPhone: "",
      reporterEmail: "",
      photos: [],
    });
    issue.convertedCaseId = created.id;
  }
  store.cleaningIssues.push(issue);
  job.updatedAt = now;
  return hydrateCleaningJob(job);
}

export function approveCleaningJob(organizationId: string, jobId: string) {
  const store = getStore();
  const job = store.cleaningJobs.find(
    (j) => j.id === jobId && j.organizationId === organizationId,
  );
  if (!job) throw new Error("Uppdraget hittades inte");
  const now = nowIso();
  job.status = "approved";
  job.approvedAt = now;
  job.updatedAt = now;
  const property = store.properties.find((p) => p.id === job.propertyId);
  if (property) {
    property.guestReady = true;
    property.updatedAt = now;
  }
  for (const notice of store.cleaningNotifications) {
    if (notice.jobId === job.id) notice.read = true;
  }
  return hydrateCleaningJob(job);
}

export function returnCleaningJob(organizationId: string, jobId: string, comment: string) {
  const store = getStore();
  const job = store.cleaningJobs.find(
    (j) => j.id === jobId && j.organizationId === organizationId,
  );
  if (!job) throw new Error("Uppdraget hittades inte");
  const now = nowIso();
  job.status = "returned";
  job.returnedAt = now;
  job.returnComment = comment.trim();
  job.updatedAt = now;
  const property = store.properties.find((p) => p.id === job.propertyId);
  if (property) {
    property.guestReady = false;
    property.updatedAt = now;
  }
  return hydrateCleaningJob(job);
}

export function markCleaningNoticeRead(organizationId: string, jobId: string) {
  const store = getStore();
  for (const notice of store.cleaningNotifications) {
    if (notice.organizationId === organizationId && notice.jobId === jobId) {
      notice.read = true;
    }
  }
}

function defaultGuideFor(property: Property): PropertyGuide {
  const now = nowIso();
  return {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    propertyId: property.id,
    organizationId: property.organizationId,
    welcome: {
      sv: `Välkommen till ${property.name}.`,
      en: `Welcome to ${property.name}.`,
    },
    wifiName: "",
    wifiPassword: "",
    checkIn: "16:00",
    checkOut: "11:00",
    houseRules: {
      sv: "Visa hänsyn till grannar. Rökning endast utomhus. Lämna bostaden i samma skick som vid ankomst.",
      en: "Please be considerate of neighbours. Smoking outdoors only. Leave the home as you found it.",
    },
    parking: {},
    waste: {},
    appliances: [],
    importantNumbers: [
      {
        id: createId(),
        label: { sv: "Nödsamtal", en: "Emergency" },
        phone: "112",
      },
    ],
    emergency: {
      sv: "Vid brand, olycka eller annat livshotande: ring 112. Kontakta därefter förvaltaren.",
      en: "In a life-threatening emergency call the local emergency number, then contact the property manager.",
    },
    categoryOrder: [...DEFAULT_CATEGORY_ORDER],
  };
}

export function ensurePropertyGuide(property: Property) {
  const store = getStore();
  const existing = store.propertyGuides.find((item) => item.propertyId === property.id);
  if (existing) return existing;
  const guide = defaultGuideFor(property);
  store.propertyGuides.push(guide);
  return guide;
}

export function getPropertyGuide(propertyId: string) {
  const store = getStore();
  const property = store.properties.find((item) => item.id === propertyId);
  if (!property) return undefined;
  return ensurePropertyGuide(property);
}

export function updatePropertyGuide(
  organizationId: string,
  propertyId: string,
  patch: Partial<
    Pick<
      PropertyGuide,
      | "welcome"
      | "wifiName"
      | "wifiPassword"
      | "checkIn"
      | "checkOut"
      | "houseRules"
      | "parking"
      | "waste"
      | "appliances"
      | "importantNumbers"
      | "emergency"
      | "categoryOrder"
    >
  >,
) {
  const property = getStore().properties.find(
    (item) => item.id === propertyId && item.organizationId === organizationId,
  );
  if (!property) throw new Error("Bostaden hittades inte");
  const guide = ensurePropertyGuide(property);
  Object.assign(guide, patch, { updatedAt: nowIso() });
  return guide;
}

export function listPlaces(organizationId: string) {
  return getStore()
    .places.filter((item) => item.organizationId === organizationId)
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
}

export function getPlace(organizationId: string, placeId: string) {
  return getStore().places.find(
    (item) => item.id === placeId && item.organizationId === organizationId,
  );
}

export function createPlace(
  organizationId: string,
  input: {
    category: PlaceCategory;
    name: string;
    description?: LocalizedText;
    imageUrl?: string;
    lat?: number;
    lng?: number;
    address?: string;
    hours?: string;
    phone?: string;
    whatsapp?: string;
    website?: string;
    bookingUrl?: string;
    discountCode?: string;
    discountLabel?: LocalizedText;
    sponsored?: boolean;
    monetization?: PlaceMonetization;
  },
) {
  const store = getStore();
  const now = nowIso();
  const place: Place = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    organizationId,
    category: input.category,
    name: input.name,
    description: input.description ?? {},
    imageUrl: input.imageUrl,
    lat: input.lat,
    lng: input.lng,
    address: input.address,
    hours: input.hours,
    phone: input.phone,
    whatsapp: input.whatsapp,
    website: input.website,
    bookingUrl: input.bookingUrl,
    discountCode: input.discountCode,
    discountLabel: input.discountLabel,
    sponsored: Boolean(input.sponsored),
    monetization: input.monetization ?? { kind: "none" },
  };
  store.places.push(place);
  return place;
}

export function updatePlace(
  organizationId: string,
  placeId: string,
  patch: Partial<Omit<Place, "id" | "createdAt" | "organizationId">>,
) {
  const place = getPlace(organizationId, placeId);
  if (!place) throw new Error("Rekommendationen hittades inte");
  Object.assign(place, patch, { updatedAt: nowIso() });
  return place;
}

export function listAssignedPlaces(propertyId: string, enabledOnly = false): PropertyPlaceWithPlace[] {
  const store = getStore();
  return store.propertyPlaces
    .filter((item) => item.propertyId === propertyId && (!enabledOnly || item.enabled))
    .map((item) => {
      const place = store.places.find((entry) => entry.id === item.placeId);
      return place ? { ...item, place } : null;
    })
    .filter((item): item is PropertyPlaceWithPlace => Boolean(item))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function assignPlaceToProperty(organizationId: string, propertyId: string, placeId: string) {
  const store = getStore();
  const property = store.properties.find(
    (item) => item.id === propertyId && item.organizationId === organizationId,
  );
  const place = getPlace(organizationId, placeId);
  if (!property || !place) throw new Error("Bostaden eller rekommendationen hittades inte");
  const existing = store.propertyPlaces.find(
    (item) => item.propertyId === propertyId && item.placeId === placeId,
  );
  if (existing) {
    existing.enabled = true;
    existing.updatedAt = nowIso();
    return existing;
  }
  const now = nowIso();
  const maxOrder = store.propertyPlaces
    .filter((item) => item.propertyId === propertyId)
    .reduce((max, item) => Math.max(max, item.sortOrder), -1);
  const row: PropertyPlace = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    propertyId,
    placeId,
    sortOrder: maxOrder + 1,
    enabled: true,
  };
  store.propertyPlaces.push(row);
  return row;
}

export function updatePropertyPlace(
  organizationId: string,
  propertyPlaceId: string,
  patch: Partial<Pick<PropertyPlace, "enabled" | "sortOrder">>,
) {
  const store = getStore();
  const row = store.propertyPlaces.find((item) => item.id === propertyPlaceId);
  if (!row) throw new Error("Kopplingen hittades inte");
  const property = store.properties.find(
    (item) => item.id === row.propertyId && item.organizationId === organizationId,
  );
  if (!property) throw new Error("Bostaden hittades inte");
  Object.assign(row, patch, { updatedAt: nowIso() });
  return row;
}

export function movePropertyPlace(organizationId: string, propertyPlaceId: string, direction: -1 | 1) {
  const store = getStore();
  const row = store.propertyPlaces.find((item) => item.id === propertyPlaceId);
  if (!row) return;
  const property = store.properties.find(
    (item) => item.id === row.propertyId && item.organizationId === organizationId,
  );
  if (!property) return;
  const siblings = store.propertyPlaces
    .filter((item) => item.propertyId === row.propertyId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const index = siblings.findIndex((item) => item.id === row.id);
  const swap = siblings[index + direction];
  if (!swap) return;
  const currentOrder = row.sortOrder;
  row.sortOrder = swap.sortOrder;
  swap.sortOrder = currentOrder;
  row.updatedAt = nowIso();
  swap.updatedAt = nowIso();
}

export function copyPropertyGuide(
  organizationId: string,
  fromPropertyId: string,
  toPropertyId: string,
) {
  const fromProperty = getProperty(organizationId, fromPropertyId);
  const toProperty = getProperty(organizationId, toPropertyId);
  if (!fromProperty || !toProperty) throw new Error("Bostaden hittades inte");
  const source = getPropertyGuide(fromPropertyId);
  if (!source) throw new Error("Bostaden hittades inte");
  updatePropertyGuide(organizationId, toPropertyId, {
    wifiName: source.wifiName,
    wifiPassword: source.wifiPassword,
    checkIn: source.checkIn,
    checkOut: source.checkOut,
    houseRules: { ...source.houseRules },
    parking: { ...source.parking },
    waste: { ...source.waste },
    emergency: { ...source.emergency },
    appliances: source.appliances.map((item) => ({
      ...item,
      id: createId(),
      title: { ...item.title },
      text: { ...item.text },
    })),
    importantNumbers: source.importantNumbers.map((item) => ({
      ...item,
      id: createId(),
      label: { ...item.label },
    })),
    categoryOrder: [...source.categoryOrder],
  });
  copyPropertyPlaces(organizationId, fromPropertyId, toPropertyId);
}

export function copyPropertyPlaces(organizationId: string, fromPropertyId: string, toPropertyId: string) {
  const store = getStore();
  const from = store.properties.find(
    (item) => item.id === fromPropertyId && item.organizationId === organizationId,
  );
  const to = store.properties.find(
    (item) => item.id === toPropertyId && item.organizationId === organizationId,
  );
  if (!from || !to) throw new Error("Bostaden hittades inte");
  const existing = new Set(
    store.propertyPlaces.filter((item) => item.propertyId === toPropertyId).map((item) => item.placeId),
  );
  const source = store.propertyPlaces
    .filter((item) => item.propertyId === fromPropertyId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const now = nowIso();
  let order = store.propertyPlaces
    .filter((item) => item.propertyId === toPropertyId)
    .reduce((max, item) => Math.max(max, item.sortOrder), -1);
  for (const row of source) {
    if (existing.has(row.placeId)) continue;
    order += 1;
    store.propertyPlaces.push({
      id: createId(),
      createdAt: now,
      updatedAt: now,
      propertyId: toPropertyId,
      placeId: row.placeId,
      sortOrder: order,
      enabled: row.enabled,
    });
  }
}

export function moveGuideCategory(
  organizationId: string,
  propertyId: string,
  category: PlaceCategory,
  direction: -1 | 1,
) {
  const guide = getPropertyGuide(propertyId);
  const property = getStore().properties.find(
    (item) => item.id === propertyId && item.organizationId === organizationId,
  );
  if (!guide || !property) return;
  const order = [...guide.categoryOrder];
  const index = order.indexOf(category);
  if (index < 0) return;
  const next = index + direction;
  if (next < 0 || next >= order.length) return;
  const current = order[index]!;
  order[index] = order[next]!;
  order[next] = current;
  guide.categoryOrder = order;
  guide.updatedAt = nowIso();
}

export function recordGuideEvent(input: {
  organizationId: string;
  propertyId: string;
  kind: GuideEventKind;
  placeId?: string;
}) {
  const store = getStore();
  store.guideEvents.push({
    id: createId(),
    createdAt: nowIso(),
    organizationId: input.organizationId,
    propertyId: input.propertyId,
    placeId: input.placeId,
    kind: input.kind,
  });
}

export function getGuideAnalytics(organizationId: string, propertyId: string): GuideAnalytics {
  const events = getStore().guideEvents.filter(
    (item) => item.organizationId === organizationId && item.propertyId === propertyId,
  );
  const clicks = events.filter((item) => item.kind !== "scan");
  const byPlaceMap = new Map<string, GuideAnalytics["byPlace"][number]>();
  for (const item of clicks) {
    if (!item.placeId) continue;
    const place = getStore().places.find((entry) => entry.id === item.placeId);
    const current = byPlaceMap.get(item.placeId) ?? {
      placeId: item.placeId,
      name: place?.name ?? item.placeId,
      clicks: 0,
      bookings: 0,
      sponsored: Boolean(place?.sponsored),
    };
    current.clicks += 1;
    if (item.kind === "click_book" || item.kind === "click_discount") current.bookings += 1;
    byPlaceMap.set(item.placeId, current);
  }
  const byKindMap = new Map<GuideEventKind, number>();
  for (const item of events) {
    byKindMap.set(item.kind, (byKindMap.get(item.kind) ?? 0) + 1);
  }
  return {
    scans: events.filter((item) => item.kind === "scan").length,
    clicks: clicks.length,
    byPlace: [...byPlaceMap.values()].sort((a, b) => b.clicks - a.clicks),
    byKind: [...byKindMap.entries()].map(([kind, count]) => ({ kind, count })),
  };
}

const CONTACT_CLICKS: GuideEventKind[] = ["click_whatsapp", "click_phone", "click_maps"];

export function getPropertyTraffic(
  organizationId: string,
  propertyId: string,
  days = 30,
): PropertyTraffic {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const events = getStore().guideEvents.filter(
    (item) =>
      item.organizationId === organizationId &&
      item.propertyId === propertyId &&
      item.createdAt >= since,
  );
  const reports = getStore().cases.filter(
    (item) =>
      item.organizationId === organizationId &&
      item.propertyId === propertyId &&
      item.createdAt >= since,
  ).length;
  return {
    scans: events.filter((item) => item.kind === "scan").length,
    guideOpens: events.filter((item) => item.kind === "scan").length,
    reports,
    contactClicks: events.filter((item) => CONTACT_CLICKS.includes(item.kind)).length,
  };
}

export function scanCountForProperty(propertyId: string) {
  return getStore().guideEvents.filter(
    (item) => item.propertyId === propertyId && item.kind === "scan",
  ).length;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export function pushNotification(input: {
  organizationId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
}) {
  const store = getStore();
  const now = nowIso();
  store.notifications.push({
    id: createId(),
    createdAt: now,
    updatedAt: now,
    organizationId: input.organizationId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    href: input.href,
    read: false,
  });
}

export function listNotifications(organizationId: string, unreadOnly = false) {
  return getStore()
    .notifications.filter(
      (n) => n.organizationId === organizationId && (!unreadOnly || !n.read),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function unreadNotificationCount(organizationId: string) {
  return listNotifications(organizationId, true).length;
}

export function markNotificationsRead(organizationId: string, id?: string) {
  const store = getStore();
  for (const notice of store.notifications) {
    if (notice.organizationId !== organizationId) continue;
    if (id && notice.id !== id) continue;
    notice.read = true;
    notice.updatedAt = nowIso();
  }
}

// ---------------------------------------------------------------------------
// Case triage, contractor assignment and internal notes
// ---------------------------------------------------------------------------

export function updateCasePriority(
  organizationId: string,
  caseId: string,
  priority: MaintenanceCase["priority"],
  actorName: string,
  label?: string,
) {
  const item = getStore().cases.find(
    (c) => c.id === caseId && c.organizationId === organizationId,
  );
  if (!item) throw new Error("Ärendet hittades inte");
  item.priority = priority;
  item.updatedAt = nowIso();
  logActivity(caseId, "status_changed", actorName, `Prioritet: ${label ?? priority}`);
  return hydrateCase(item);
}

export function updateCaseDetails(
  organizationId: string,
  caseId: string,
  patch: { dueAt?: string | null; costEstimate?: number | null },
  actorName: string,
) {
  const item = getStore().cases.find(
    (entry) => entry.id === caseId && entry.organizationId === organizationId,
  );
  if (!item) throw new Error("Ärendet hittades inte");
  if (patch.dueAt !== undefined) {
    item.dueAt = patch.dueAt || undefined;
  }
  if (patch.costEstimate !== undefined) {
    item.costEstimate =
      patch.costEstimate == null || Number.isNaN(patch.costEstimate)
        ? undefined
        : Math.round(patch.costEstimate);
  }
  item.updatedAt = nowIso();
  logActivity(caseId, "status_changed", actorName, "Deadline och kostnadsförslag uppdaterades");
  return hydrateCase(item);
}

export function addCaseNote(
  organizationId: string,
  caseId: string,
  authorName: string,
  text: string,
) {
  const store = getStore();
  const item = store.cases.find(
    (c) => c.id === caseId && c.organizationId === organizationId,
  );
  if (!item) throw new Error("Ärendet hittades inte");
  const now = nowIso();
  store.caseNotes.push({
    id: createId(),
    createdAt: now,
    updatedAt: now,
    caseId,
    organizationId,
    authorName,
    text: text.trim(),
  });
  logActivity(caseId, "note_added", authorName, "Intern anteckning tillagd");
  return hydrateCase(item);
}

/**
 * Assigning a contractor mints a fresh work token. Unassigning clears it, which
 * immediately revokes any link the previous contractor still has.
 */
export function setCaseWorkOrder(input: {
  organizationId: string;
  caseId: string;
  contractorId?: string;
  instructions?: string;
  actorName: string;
}) {
  const store = getStore();
  const item = store.cases.find(
    (c) => c.id === input.caseId && c.organizationId === input.organizationId,
  );
  if (!item) throw new Error("Ärendet hittades inte");
  const contractor = input.contractorId
    ? store.contractors.find(
        (c) => c.id === input.contractorId && c.organizationId === input.organizationId,
      )
    : undefined;
  if (input.contractorId && !contractor) throw new Error("Hantverkaren hittades inte");

  const now = nowIso();
  const changed = item.contractorId !== input.contractorId;
  item.contractorId = contractor?.id;
  if (input.instructions !== undefined) {
    item.workInstructions = input.instructions.trim() || undefined;
  }
  if (changed) {
    item.workToken = contractor ? createToken("wk") : undefined;
    item.contractorAcceptedAt = undefined;
    item.contractorDeclinedAt = undefined;
    item.declineReason = undefined;
    if (contractor && (item.status === "new" || item.status === "reviewing")) {
      item.status = "assigned";
    }
  }
  item.updatedAt = now;
  logActivity(
    input.caseId,
    "contractor_assigned",
    input.actorName,
    contractor ? `Tilldelad ${contractor.name}` : "Tilldelning togs bort",
  );
  return hydrateCase(item);
}

export function rotateWorkToken(organizationId: string, caseId: string) {
  const item = getStore().cases.find(
    (c) => c.id === caseId && c.organizationId === organizationId,
  );
  if (!item) throw new Error("Ärendet hittades inte");
  item.workToken = item.contractorId ? createToken("wk") : undefined;
  item.updatedAt = nowIso();
  return item.workToken;
}

/** Contractor-side lookup. Only resolves while the token is the current one. */
export function getCaseByWorkToken(token: string) {
  const item = getStore().cases.find((c) => c.workToken === token && Boolean(token));
  return item ? hydrateCase(item) : undefined;
}

export function contractorRespond(input: {
  token: string;
  accept: boolean;
  reason?: string;
  actorName: string;
}) {
  const store = getStore();
  const item = store.cases.find((c) => c.workToken === input.token && Boolean(input.token));
  if (!item) throw new Error("Uppdraget hittades inte");
  const now = nowIso();
  if (input.accept) {
    item.contractorAcceptedAt = now;
    item.contractorDeclinedAt = undefined;
    item.declineReason = undefined;
    item.status = "accepted";
    logActivity(item.id, "status_changed", input.actorName, "Hantverkaren accepterade uppdraget");
  } else {
    item.contractorDeclinedAt = now;
    item.contractorAcceptedAt = undefined;
    item.declineReason = input.reason?.trim();
    item.status = "waiting";
    // Declining revokes the link so the job has to be reassigned deliberately.
    item.workToken = undefined;
    item.contractorId = undefined;
    logActivity(item.id, "status_changed", input.actorName, "Hantverkaren tackade nej");
  }
  item.updatedAt = now;
  return hydrateCase(item);
}

export function contractorUpdateStatus(input: {
  token: string;
  status: CaseStatus;
  actorName: string;
  label?: string;
}) {
  const store = getStore();
  const item = store.cases.find((c) => c.workToken === input.token && Boolean(input.token));
  if (!item) throw new Error("Uppdraget hittades inte");
  const now = nowIso();
  item.status = input.status;
  item.updatedAt = now;
  if (input.status === "resolved") {
    item.completedAt = now;
    logActivity(item.id, "marked_resolved", input.actorName, "Hantverkaren markerade arbetet som klart");
  } else {
    logActivity(item.id, "status_changed", input.actorName, `Status: ${input.label ?? input.status}`);
  }
  return hydrateCase(item);
}

export function contractorAddPhotos(input: {
  token: string;
  kind: "before" | "after";
  photos: { url: string; caption?: string }[];
  actorName: string;
}) {
  const store = getStore();
  const item = store.cases.find((c) => c.workToken === input.token && Boolean(input.token));
  if (!item) throw new Error("Uppdraget hittades inte");
  const now = nowIso();
  for (const photo of input.photos) {
    store.attachments.push({
      id: createId(),
      createdAt: now,
      updatedAt: now,
      caseId: item.id,
      kind: input.kind,
      url: photo.url,
      caption: photo.caption,
    });
  }
  item.updatedAt = now;
  logActivity(item.id, "photos_added", input.actorName, `${input.photos.length} bilder lades till`);
  return hydrateCase(item);
}

export function contractorAddMessage(input: {
  token: string;
  text: string;
  authorName: string;
  locale?: string;
}) {
  const store = getStore();
  const item = store.cases.find((c) => c.workToken === input.token && Boolean(input.token));
  if (!item) throw new Error("Uppdraget hittades inte");
  return addMessage({
    caseId: item.id,
    organizationId: item.organizationId,
    author: "contractor",
    authorName: input.authorName,
    text: input.text,
    locale: input.locale,
  });
}

export function approveCase(organizationId: string, caseId: string, actorName: string) {
  const item = getStore().cases.find(
    (c) => c.id === caseId && c.organizationId === organizationId,
  );
  if (!item) throw new Error("Ärendet hittades inte");
  const now = nowIso();
  item.status = "approved";
  item.approvedAt = now;
  item.completedAt = item.completedAt ?? now;
  item.updatedAt = now;
  // Approval closes the contractor's access.
  item.workToken = undefined;
  logActivity(caseId, "status_changed", actorName, "Arbetet godkändes");
  return hydrateCase(item);
}

export function reopenCase(organizationId: string, caseId: string, actorName: string) {
  const item = getStore().cases.find(
    (c) => c.id === caseId && c.organizationId === organizationId,
  );
  if (!item) throw new Error("Ärendet hittades inte");
  const now = nowIso();
  item.status = item.contractorId ? "in_progress" : "waiting";
  item.approvedAt = undefined;
  item.completedAt = undefined;
  item.updatedAt = now;
  if (item.contractorId && !item.workToken) item.workToken = createToken("wk");
  logActivity(caseId, "status_changed", actorName, "Ärendet återöppnades");
  return hydrateCase(item);
}

// ---------------------------------------------------------------------------
// Owner access
// ---------------------------------------------------------------------------

export function listOwnerAccess(organizationId: string, propertyId?: string) {
  return getStore()
    .ownerAccess.filter(
      (o) => o.organizationId === organizationId && (!propertyId || o.propertyId === propertyId),
    )
    .map((o) => ({ ...o }))
    .sort((a, b) => a.ownerName.localeCompare(b.ownerName, "sv"));
}

export function createOwnerAccess(input: {
  organizationId: string;
  propertyId: string;
  ownerName: string;
  ownerEmail: string;
}) {
  const store = getStore();
  const property = store.properties.find(
    (p) => p.id === input.propertyId && p.organizationId === input.organizationId,
  );
  if (!property) throw new Error("Bostaden hittades inte");
  const now = nowIso();
  const access: OwnerAccess = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    organizationId: input.organizationId,
    propertyId: input.propertyId,
    token: createToken("ow"),
    ownerName: input.ownerName.trim(),
    ownerEmail: input.ownerEmail.trim(),
    active: true,
  };
  store.ownerAccess.push(access);
  // Snapshot, so a caller holding the result cannot mutate stored state and
  // does not silently observe a later token rotation.
  return { ...access };
}

export function setOwnerAccessActive(organizationId: string, id: string, active: boolean) {
  const access = getStore().ownerAccess.find(
    (o) => o.id === id && o.organizationId === organizationId,
  );
  if (!access) throw new Error("Åtkomsten hittades inte");
  access.active = active;
  access.updatedAt = nowIso();
  return { ...access };
}

export function rotateOwnerAccess(organizationId: string, id: string) {
  const access = getStore().ownerAccess.find(
    (o) => o.id === id && o.organizationId === organizationId,
  );
  if (!access) throw new Error("Åtkomsten hittades inte");
  access.token = createToken("ow");
  access.updatedAt = nowIso();
  return { ...access };
}

/**
 * Everything an owner is allowed to see for one property. Deliberately built by
 * picking fields rather than spreading records, so a new internal field can
 * never leak by default.
 */
export function getOwnerView(token: string) {
  const store = getStore();
  const access = store.ownerAccess.find((o) => o.token === token && o.active);
  if (!access) return undefined;
  const property = store.properties.find((p) => p.id === access.propertyId);
  if (!property) return undefined;
  const org = getOrganization(access.organizationId);

  const cases = store.cases
    .filter((c) => c.propertyId === property.id && c.status !== "cancelled")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((item) => ({
      id: item.id,
      reference: item.reference,
      title: item.title,
      category: item.category,
      status: item.status,
      priority: item.priority,
      createdAt: item.createdAt,
      completedAt: item.completedAt,
      approvedAt: item.approvedAt,
      dueAt: item.dueAt,
      costEstimate: item.costEstimate,
      // Only work the manager has signed off on carries photos for the owner.
      photos:
        item.status === "approved"
          ? store.attachments
              .filter((a) => a.caseId === item.id && a.kind !== "reported")
              .map((a) => ({ id: a.id, kind: a.kind, url: a.url, caption: a.caption }))
          : [],
    }));

  const cleaning = store.cleaningJobs
    .filter((j) => j.propertyId === property.id)
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
    .slice(0, 10)
    .map((job) => ({
      id: job.id,
      status: job.status,
      scheduledAt: job.scheduledAt,
      completedAt: job.completedAt,
      approvedAt: job.approvedAt,
    }));

  return {
    access,
    orgName: org?.name ?? "",
    property: {
      id: property.id,
      name: property.name,
      address: property.address,
      city: property.city,
      country: property.country,
      imageUrl: property.imageUrl,
      guestReady: Boolean(property.guestReady),
    },
    cases,
    cleaning,
    openCount: cases.filter((c) => OPEN_STATUSES.includes(c.status)).length,
    approvedCount: cases.filter((c) => c.status === "approved").length,
  };
}

// ---------------------------------------------------------------------------
// Pilot programme leads
// ---------------------------------------------------------------------------

export function createPilotLead(input: Omit<PilotLead, "id" | "createdAt" | "updatedAt">) {
  const store = getStore();
  const now = nowIso();
  const lead: PilotLead = { ...input, id: createId(), createdAt: now, updatedAt: now };
  store.pilotLeads.push(lead);
  return lead;
}

export function listPilotLeads() {
  return [...getStore().pilotLeads].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getGuestGuide(token: string) {
  const property = getPropertyByToken(token);
  if (!property) return undefined;
  const org = getOrganization(property.organizationId);
  const guide = ensurePropertyGuide(property);
  const places = listAssignedPlaces(property.id, true);
  return {
    property: {
      name: property.name,
      address: property.address,
      city: property.city,
      country: property.country,
      lat: property.lat,
      lng: property.lng,
    },
    org: org
      ? {
          name: org.name,
          supportEmail: org.supportEmail,
          supportPhone: org.supportPhone,
          emergencyPhone: org.emergencyPhone,
        }
      : undefined,
    guide: {
      welcome: guide.welcome,
      wifiName: guide.wifiName,
      wifiPassword: guide.wifiPassword,
      checkIn: guide.checkIn,
      checkOut: guide.checkOut,
      houseRules: guide.houseRules,
      parking: guide.parking,
      waste: guide.waste,
      appliances: guide.appliances,
      importantNumbers: guide.importantNumbers,
      emergency: guide.emergency,
      categoryOrder: guide.categoryOrder,
    },
    places,
  };
}

export function guestLinkIsOpen(property: Property) {
  if (property.guestLinkRevokedAt) return false;
  if (property.guestLinkExpiresAt && Date.parse(property.guestLinkExpiresAt) < Date.now()) {
    return false;
  }
  return true;
}

function ensureHostMembership(userId: string, organizationId: string) {
  const existing = getStore().memberships.find(
    (item) =>
      item.userId === userId &&
      item.organizationId === organizationId &&
      item.role === "host" &&
      !item.revokedAt,
  );
  if (existing) return existing;
  return createMembership({
    userId,
    organizationId,
    role: "host",
    propertyIds: [],
  });
}

export function createMembership(input: {
  userId: string;
  organizationId: string;
  role: StaffRole;
  propertyIds: string[];
  directoryId?: string;
}) {
  const store = getStore();
  const now = nowIso();
  const membership: Membership = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    userId: input.userId,
    organizationId: input.organizationId,
    role: input.role,
    propertyIds: input.role === "host" ? [] : [...input.propertyIds],
    directoryId: input.directoryId,
  };
  store.memberships.push(membership);
  return membership;
}

export function getMembership(id: string) {
  return getStore().memberships.find((item) => item.id === id);
}

export function listMembershipsForUser(userId: string, includeRevoked = false) {
  return getStore()
    .memberships.filter((item) => item.userId === userId && (includeRevoked || !item.revokedAt))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getActiveMembership(
  userId: string,
  organizationId?: string,
  role?: StaffRole,
) {
  const items = listMembershipsForUser(userId).filter(
    (item) => !organizationId || item.organizationId === organizationId,
  );
  if (role) return items.find((item) => item.role === role) ?? null;
  return items.find((item) => item.role === "host") ?? items[0] ?? null;
}

function propertyInScope(membership: Membership, propertyId: string) {
  return canAccessProperty(membership, propertyId, membership.organizationId);
}

export function listPropertiesForMembership(
  membership: Membership,
  filters: PropertyFilters = {},
) {
  return listProperties(membership.organizationId, filters).filter((property) =>
    propertyInScope(membership, property.id),
  );
}

export function listCasesForMembership(membership: Membership, filters: CaseFilters = {}) {
  let items = listCases(membership.organizationId, filters).filter((item) =>
    propertyInScope(membership, item.propertyId),
  );
  if (membership.role === "contractor") {
    items = items.filter((item) => item.contractorId === membership.directoryId);
    for (const item of items) {
      if (!item.workToken) {
        const raw = getStore().cases.find((row) => row.id === item.id);
        if (raw && !raw.workToken) {
          raw.workToken = createToken("wk");
          item.workToken = raw.workToken;
        }
      }
    }
  }
  if (membership.role === "cleaner") {
    items = [];
  }
  return items;
}

export function listCleaningJobsForMembership(membership: Membership) {
  let jobs = listCleaningJobs(membership.organizationId).filter((job) =>
    propertyInScope(membership, job.propertyId),
  );
  if (membership.role === "cleaner") {
    jobs = jobs.filter((job) => job.cleanerId === membership.directoryId);
  }
  if (membership.role === "contractor") {
    jobs = [];
  }
  return jobs;
}

export function cleanerMayAccessJob(membership: Membership, job: CleaningJob) {
  if (!membershipIsActive(membership) || membership.role !== "cleaner") return false;
  if (job.organizationId !== membership.organizationId) return false;
  if (job.cleanerId !== membership.directoryId) return false;
  return propertyInScope(membership, job.propertyId);
}

export function contractorMayAccessCase(membership: Membership, item: MaintenanceCase) {
  if (!membershipIsActive(membership) || membership.role !== "contractor") return false;
  if (item.organizationId !== membership.organizationId) return false;
  if (item.contractorId !== membership.directoryId) return false;
  return propertyInScope(membership, item.propertyId);
}

export function createStaffProfile(input: {
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  locale?: string;
  password?: string;
}) {
  const existing = getProfileByEmail(input.email);
  if (existing) return existing;
  const store = getStore();
  const now = nowIso();
  const profile: Profile = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    organizationId: input.organizationId,
    firstName: input.firstName,
    lastName: input.lastName,
    fullName: `${input.firstName} ${input.lastName}`.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone ?? "",
    phoneCountry: "SE",
    country: "SE",
    locale: input.locale ?? "sv",
    unitBand: "1-5",
    marketingConsent: false,
    emailVerifiedAt: now,
    onboardingCompletedAt: now,
    passwordHash: input.password ? hashPassword(input.password) : undefined,
  };
  store.profiles.push(profile);
  return profile;
}

export function createInvitation(input: {
  organizationId: string;
  email: string;
  phone?: string;
  role: StaffRole;
  propertyIds: string[];
  invitedByUserId: string;
  directoryId?: string;
  channel?: Invitation["channel"];
}) {
  if (!canInviteRole("host", input.role)) {
    throw new Error("invite-role");
  }
  const store = getStore();
  const now = nowIso();
  const id = createId();
  const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000).toISOString();
  const ticket = encodeAccessTicket({
    k: "invite",
    oid: input.organizationId,
    em: input.email.trim().toLowerCase(),
    role: input.role,
    iid: id,
    props: input.propertyIds,
    dir: input.directoryId,
    exp: Date.parse(expiresAt),
  });
  const invitation: Invitation = {
    id,
    createdAt: now,
    updatedAt: now,
    organizationId: input.organizationId,
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || undefined,
    role: input.role,
    propertyIds: [...input.propertyIds],
    invitedByUserId: input.invitedByUserId,
    tokenHash: hashToken(ticket),
    expiresAt,
    channel: input.channel ?? (input.phone ? "sms" : "email"),
    directoryId: input.directoryId,
  };
  store.invitations.push(invitation);
  return { invitation, rawToken: ticket };
}

export function listInvitations(organizationId: string) {
  return getStore()
    .invitations.filter((item) => item.organizationId === organizationId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getInvitationByToken(rawToken: string) {
  const hashed = hashToken(rawToken);
  return getStore().invitations.find((item) => item.tokenHash === hashed);
}

export function revokeInvitation(organizationId: string, invitationId: string) {
  const invitation = getStore().invitations.find(
    (item) => item.id === invitationId && item.organizationId === organizationId,
  );
  if (!invitation) throw new Error("missing");
  invitation.revokedAt = nowIso();
  invitation.updatedAt = invitation.revokedAt;
  return invitation;
}

function directoryForInvite(invitation: Invitation, profile: Profile) {
  if (invitation.directoryId) return invitation.directoryId;
  if (invitation.role === "cleaner") {
    const existing = getStore().cleaners.find(
      (item) =>
        item.organizationId === invitation.organizationId &&
        item.email.toLowerCase() === invitation.email,
    );
    if (existing) return existing.id;
    return addCleaner(invitation.organizationId, {
      name: profile.fullName,
      contactName: profile.fullName,
      phone: invitation.phone ?? profile.phone,
      email: invitation.email,
    }).id;
  }
  if (invitation.role === "contractor") {
    const existing = getStore().contractors.find(
      (item) =>
        item.organizationId === invitation.organizationId &&
        item.email.toLowerCase() === invitation.email,
    );
    if (existing) return existing.id;
    return addContractor(invitation.organizationId, {
      name: profile.fullName,
      contactName: profile.fullName,
      trade: "Allmänt",
      email: invitation.email,
      phone: invitation.phone ?? profile.phone,
    }).id;
  }
  return undefined;
}

export function acceptInvitation(
  rawToken: string,
  opts?: { firstName?: string; lastName?: string; password?: string },
) {
  const ticket = decodeAccessTicket(rawToken);
  if (!ticket || ticket.k !== "invite" || isAccessTicketExpired(ticket)) return null;
  const invitation = getInvitationByToken(rawToken);
  if (!invitation || invitation.id !== ticket.iid) return null;
  if (invitation.acceptedAt || invitation.revokedAt) return null;
  if (Date.parse(invitation.expiresAt) < Date.now()) return null;

  const names = `${opts?.firstName ?? ""} ${opts?.lastName ?? ""}`.trim();
  const [firstFromEmail] = invitation.email.split("@");
  const profile = createStaffProfile({
    organizationId: invitation.organizationId,
    firstName: opts?.firstName?.trim() || firstFromEmail || "Gäst",
    lastName: opts?.lastName?.trim() || "",
    email: invitation.email,
    phone: invitation.phone,
    password: opts?.password,
  });
  if (names) {
    profile.firstName = opts?.firstName?.trim() || profile.firstName;
    profile.lastName = opts?.lastName?.trim() || profile.lastName;
    profile.fullName = names || profile.fullName;
  }
  if (opts?.password) setProfilePassword(profile.id, opts.password);
  profile.emailVerifiedAt = profile.emailVerifiedAt ?? nowIso();
  profile.onboardingCompletedAt = profile.onboardingCompletedAt ?? nowIso();

  const duplicate = listMembershipsForUser(profile.id).find(
    (item) =>
      item.organizationId === invitation.organizationId &&
      item.role === invitation.role &&
      !item.revokedAt,
  );
  const membership =
    duplicate ??
    createMembership({
      userId: profile.id,
      organizationId: invitation.organizationId,
      role: invitation.role,
      propertyIds: invitation.propertyIds,
      directoryId: directoryForInvite(invitation, profile),
    });

  const now = nowIso();
  invitation.acceptedAt = now;
  invitation.updatedAt = now;
  return { profile, membership, invitation };
}

export function createLoginLink(input: {
  userId: string;
  intendedRole?: StaffRole;
  intendedOrganizationId?: string;
}) {
  const profile = getProfile(input.userId);
  if (!profile) throw new Error("missing");
  const store = getStore();
  const now = nowIso();
  const id = createId();
  const expiresAt = new Date(Date.now() + LOGIN_LINK_TTL_MINUTES * 60 * 1000).toISOString();
  const ticket = encodeAccessTicket({
    k: "login",
    oid: input.intendedOrganizationId ?? profile.organizationId,
    em: profile.email,
    role: input.intendedRole ?? "host",
    lid: id,
    props: [],
    exp: Date.parse(expiresAt),
  });
  const link: LoginLink = {
    id,
    createdAt: now,
    updatedAt: now,
    userId: profile.id,
    tokenHash: hashToken(ticket),
    expiresAt,
    intendedRole: input.intendedRole,
    intendedOrganizationId: input.intendedOrganizationId,
  };
  store.loginLinks.push(link);
  return { link, rawToken: ticket };
}

export function consumeLoginLink(rawToken: string) {
  const ticket = decodeAccessTicket(rawToken);
  if (!ticket || ticket.k !== "login" || isAccessTicketExpired(ticket)) return null;
  const store = getStore();
  const link = store.loginLinks.find((item) => item.tokenHash === hashToken(rawToken));
  if (!link || (ticket.lid && link.id !== ticket.lid)) return null;
  if (link.usedAt) return null;
  if (Date.parse(link.expiresAt) < Date.now()) return null;
  const profile = getProfile(link.userId);
  if (!profile) return null;
  const now = nowIso();
  link.usedAt = now;
  link.updatedAt = now;
  const membership = getActiveMembership(
    profile.id,
    link.intendedOrganizationId,
    link.intendedRole,
  );
  return { profile, link, membership };
}

export function setGuestPin(organizationId: string, propertyId: string, pin: string | null) {
  const property = getStore().properties.find(
    (item) => item.id === propertyId && item.organizationId === organizationId,
  );
  if (!property) throw new Error("Bostaden hittades inte");
  const trimmed = pin?.trim() ?? "";
  property.guestPinHash = trimmed ? hashPassword(trimmed) : undefined;
  property.updatedAt = nowIso();
  return property;
}

export function setGuestLinkExpiry(
  organizationId: string,
  propertyId: string,
  expiresAt: string | null,
) {
  const property = getStore().properties.find(
    (item) => item.id === propertyId && item.organizationId === organizationId,
  );
  if (!property) throw new Error("Bostaden hittades inte");
  property.guestLinkExpiresAt = expiresAt || undefined;
  property.updatedAt = nowIso();
  return property;
}

export function revokeGuestLink(organizationId: string, propertyId: string) {
  const property = getStore().properties.find(
    (item) => item.id === propertyId && item.organizationId === organizationId,
  );
  if (!property) throw new Error("Bostaden hittades inte");
  property.guestLinkRevokedAt = nowIso();
  property.updatedAt = property.guestLinkRevokedAt;
  return property;
}

export function verifyGuestPin(property: Property, pin: string) {
  if (!property.guestPinHash) return true;
  return verifyPassword(pin.trim(), property.guestPinHash);
}

function sanitizedOwnerProperty(property: Property) {
  const store = getStore();
  const org = getOrganization(property.organizationId);
  const cases = store.cases
    .filter((c) => c.propertyId === property.id && c.status !== "cancelled")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((item) => ({
      id: item.id,
      reference: item.reference,
      title: item.title,
      category: item.category,
      status: item.status,
      priority: item.priority,
      createdAt: item.createdAt,
      completedAt: item.completedAt,
      approvedAt: item.approvedAt,
      dueAt: item.dueAt,
      costEstimate: item.costEstimate,
      photos:
        item.status === "approved"
          ? store.attachments
              .filter((a) => a.caseId === item.id && a.kind !== "reported")
              .map((a) => ({ id: a.id, kind: a.kind, url: a.url, caption: a.caption }))
          : [],
    }));
  const cleaning = store.cleaningJobs
    .filter((j) => j.propertyId === property.id)
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
    .slice(0, 10)
    .map((job) => ({
      id: job.id,
      status: job.status,
      scheduledAt: job.scheduledAt,
      completedAt: job.completedAt,
      approvedAt: job.approvedAt,
    }));
  return {
    orgName: org?.name ?? "",
    property: {
      id: property.id,
      name: property.name,
      address: property.address,
      city: property.city,
      country: property.country,
      imageUrl: property.imageUrl,
      guestReady: Boolean(property.guestReady),
    },
    cases,
    cleaning,
    openCount: cases.filter((c) => OPEN_STATUSES.includes(c.status)).length,
    approvedCount: cases.filter((c) => c.status === "approved").length,
  };
}

export function getOwnerViewsForMembership(membership: Membership) {
  if (!membershipIsActive(membership) || membership.role !== "owner") return [];
  return listPropertiesForMembership(membership)
    .map((property) => sanitizedOwnerProperty(property))
    .filter(Boolean);
}

export function switchActiveMembership(userId: string, membershipId: string) {
  const membership = getMembership(membershipId);
  if (!membershipIsActive(membership) || membership.userId !== userId) return null;
  return membership;
}
