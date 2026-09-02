export const CASE_STATUSES = [
  "new",
  "waiting",
  "assigned",
  "in_progress",
  "resolved",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const OPEN_STATUSES: readonly CaseStatus[] = [
  "new",
  "waiting",
  "assigned",
  "in_progress",
];

export const CASE_PRIORITIES = ["low", "soon", "urgent"] as const;
export type CasePriority = (typeof CASE_PRIORITIES)[number];

export const CASE_CATEGORIES = [
  "water",
  "electricity",
  "hvac",
  "appliances",
  "lock",
  "bathroom",
  "kitchen",
  "furniture",
  "internet",
  "other",
] as const;
export type CaseCategory = (typeof CASE_CATEGORIES)[number];

export const PROPERTY_HEALTH = ["good", "attention", "critical"] as const;
export type PropertyHealth = (typeof PROPERTY_HEALTH)[number];

export const PROPERTY_TYPES = ["apartment", "house", "villa"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const MESSAGE_AUTHORS = ["owner", "tenant", "contractor", "system"] as const;
export type MessageAuthor = (typeof MESSAGE_AUTHORS)[number];

export const ACTIVITY_TYPES = [
  "case_created",
  "status_changed",
  "contractor_assigned",
  "message_sent",
  "photos_added",
  "marked_resolved",
  "tenant_confirmed",
  "note_added",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization extends BaseRecord {
  name: string;
  supportEmail: string;
  supportPhone: string;
  emergencyPhone: string;
}

export interface Profile extends BaseRecord {
  organizationId: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash?: string;
}

export interface PropertyDocument {
  id: string;
  name: string;
  kind: "contract" | "guide" | "other";
}

export interface InspectionPhoto {
  id: string;
  url: string;
  caption: string;
}

export interface Property extends BaseRecord {
  organizationId: string;
  name: string;
  address: string;
  city: string;
  country: string;
  countryCode: string;
  imageUrl: string;
  type: PropertyType;
  sqm: number;
  rooms: number;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  leaseStart: string;
  leaseEnd: string;
  lastInspection: string;
  reportToken: string;
  notes?: string;
  documents: PropertyDocument[];
  inspectionPhotos: InspectionPhoto[];
}

export interface Contractor extends BaseRecord {
  organizationId: string;
  name: string;
  contactName: string;
  trade: string;
  email: string;
  phone: string;
}

export interface Attachment extends BaseRecord {
  caseId: string;
  kind: "reported" | "before" | "after";
  url: string;
  caption?: string;
}

export interface CaseMessage extends BaseRecord {
  caseId: string;
  author: MessageAuthor;
  authorName: string;
  text: string;
  readByOwner: boolean;
}

export interface ActivityLog extends BaseRecord {
  caseId: string;
  type: ActivityType;
  actorName: string;
  text: string;
}

export interface MaintenanceCase extends BaseRecord {
  organizationId: string;
  reference: string;
  propertyId: string;
  category: CaseCategory;
  priority: CasePriority;
  status: CaseStatus;
  title: string;
  description: string;
  discoveredAt: string;
  stillOngoing: boolean;
  reporterName: string;
  reporterPhone: string;
  reporterEmail: string;
  contractorId?: string;
  trackToken: string;
  completedAt?: string;
  tenantConfirmedAt?: string;
}

export interface CaseWithRelations extends MaintenanceCase {
  property: Property;
  contractor?: Contractor;
  attachments: Attachment[];
  messages: CaseMessage[];
  activity: ActivityLog[];
}

export interface PropertyWithMeta extends Property {
  health: PropertyHealth;
  openCaseCount: number;
  urgentCaseCount: number;
  totalCaseCount: number;
  latestCase?: MaintenanceCase;
}

export interface DashboardStats {
  propertyCount: number;
  newCases: number;
  openCases: number;
  resolvedThisMonth: number;
  urgentCases: number;
}

export interface MonthDatum {
  month: string;
  label: string;
  reported: number;
  resolved: number;
}

export interface CategoryDatum {
  category: CaseCategory;
  count: number;
}

export interface RecurringIssue {
  propertyId: string;
  propertyName: string;
  category: CaseCategory;
  count: number;
}

export interface PropertyEvent {
  id: string;
  at: string;
  title: string;
  text: string;
  kind: "lease" | "inspection" | "case" | "resolved" | "note";
}

export interface InboxThread {
  caseId: string;
  reference: string;
  propertyName: string;
  lastMessage: CaseMessage;
  unread: boolean;
}

export interface CaseFilters {
  status?: CaseStatus | "all";
  priority?: CasePriority | "all";
  propertyId?: string | "all";
  category?: CaseCategory | "all";
  query?: string;
}

export interface PropertyFilters {
  country?: string | "all";
  city?: string | "all";
  health?: PropertyHealth | "all";
  query?: string;
}
