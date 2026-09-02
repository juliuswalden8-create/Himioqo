import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { sv } from "date-fns/locale";
import {
  activity as seedActivity,
  attachments as seedAttachments,
  cases as seedCases,
  contractors as seedContractors,
  messages as seedMessages,
  organization as seedOrganization,
  profile as seedProfile,
  properties as seedProperties,
} from "@/lib/data/seed";
import { STATUS_LABEL } from "@/lib/labels";
import type {
  ActivityLog,
  Attachment,
  CaseFilters,
  CaseMessage,
  CaseWithRelations,
  CategoryDatum,
  Contractor,
  DashboardStats,
  InboxThread,
  MaintenanceCase,
  MonthDatum,
  Organization,
  Profile,
  Property,
  PropertyEvent,
  PropertyFilters,
  PropertyHealth,
  PropertyWithMeta,
  RecurringIssue,
} from "@/lib/types";
import { OPEN_STATUSES } from "@/lib/types";
import { createId, createToken, nowIso } from "@/lib/utils";

interface StoreShape {
  organizations: Organization[];
  profiles: Profile[];
  properties: Property[];
  contractors: Contractor[];
  cases: MaintenanceCase[];
  attachments: Attachment[];
  messages: CaseMessage[];
  activity: ActivityLog[];
  caseSeq: number;
}

const globalForStore = globalThis as unknown as { __pcStore?: StoreShape };

function createInitial(): StoreShape {
  return {
    organizations: [structuredClone(seedOrganization)],
    profiles: [structuredClone(seedProfile)],
    properties: structuredClone(seedProperties),
    contractors: structuredClone(seedContractors),
    cases: structuredClone(seedCases),
    attachments: structuredClone(seedAttachments),
    messages: structuredClone(seedMessages),
    activity: structuredClone(seedActivity),
    caseSeq: 189,
  };
}

function getStore(): StoreShape {
  if (!globalForStore.__pcStore) {
    globalForStore.__pcStore = createInitial();
  }
  return globalForStore.__pcStore;
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
  };
}

function nextReference(): string {
  const store = getStore();
  const year = new Date().getFullYear();
  const ref = `PC-${year}-${String(store.caseSeq).padStart(4, "0")}`;
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

export function authenticate(email: string, password: string) {
  const profile = getProfileByEmail(email);
  if (!profile || profile.passwordHash !== password) return null;
  return profile;
}

export function registerAccount(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  organizationName: string;
}) {
  if (getProfileByEmail(input.email)) {
    throw new Error("E-postadressen används redan");
  }
  const store = getStore();
  const now = nowIso();
  const organizationId = createId();
  const profileId = createId();
  store.organizations.push({
    id: organizationId,
    createdAt: now,
    updatedAt: now,
    name: input.organizationName,
    supportEmail: input.email,
    supportPhone: input.phone,
    emergencyPhone: "112",
  });
  const profile: Profile = {
    id: profileId,
    createdAt: now,
    updatedAt: now,
    organizationId,
    fullName: input.fullName,
    email: input.email.trim().toLowerCase(),
    phone: input.phone,
    passwordHash: input.password,
  };
  store.profiles.push(profile);
  return profile;
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
  return property ? withMeta(property) : undefined;
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
  return withMeta(property);
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
      return (
        c.reference.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.reporterName.toLowerCase().includes(q) ||
        property?.name.toLowerCase().includes(q)
      );
    });
  }

  return items
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
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
  return {
    propertyCount: properties.length,
    newCases: cases.filter((c) => c.status === "new").length,
    openCases: cases.filter((c) => OPEN_STATUSES.includes(c.status)).length,
    resolvedThisMonth: cases.filter(
      (c) => c.status === "resolved" && (c.completedAt ?? c.updatedAt) >= monthStart,
    ).length,
    urgentCases: cases.filter(
      (c) => c.priority === "urgent" && OPEN_STATUSES.includes(c.status),
    ).length,
  };
}

export function getAttentionProperties(organizationId: string) {
  return listProperties(organizationId)
    .filter((p) => p.health !== "good")
    .sort((a, b) => b.urgentCaseCount - a.urgentCaseCount || b.openCaseCount - a.openCaseCount);
}

export function getMonthSeries(organizationId: string): MonthDatum[] {
  const cases = getStore().cases.filter((c) => c.organizationId === organizationId);
  const points: MonthDatum[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const date = subMonths(startOfMonth(new Date()), i);
    const key = format(date, "yyyy-MM");
    const reported = cases.filter((c) => c.createdAt.startsWith(key)).length;
    const resolved = cases.filter(
      (c) => c.status === "resolved" && (c.completedAt ?? "").startsWith(key),
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
  return hydrateCase(item);
}

export function updateCaseStatus(
  organizationId: string,
  caseId: string,
  status: MaintenanceCase["status"],
  actorName: string,
) {
  const store = getStore();
  const item = store.cases.find(
    (c) => c.id === caseId && c.organizationId === organizationId,
  );
  if (!item) throw new Error("Ärendet hittades inte");
  const now = nowIso();
  item.status = status;
  item.updatedAt = now;
  if (status === "resolved") {
    item.completedAt = now;
    logActivity(caseId, "marked_resolved", actorName, "Ärendet markerades som löst");
  } else {
    logActivity(
      caseId,
      "status_changed",
      actorName,
      `Status ändrad till ${STATUS_LABEL[status]}`,
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
  patch: Partial<Pick<Organization, "name" | "supportEmail" | "supportPhone" | "emergencyPhone">>,
) {
  const org = getOrganization(organizationId);
  if (!org) throw new Error("Organisationen hittades inte");
  Object.assign(org, patch, { updatedAt: nowIso() });
  return org;
}

export function updateProfile(
  profileId: string,
  patch: Partial<Pick<Profile, "fullName" | "phone" | "email">>,
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
