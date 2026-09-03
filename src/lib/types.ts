export const CASE_STATUSES = [
  "new",
  "reviewing",
  "assigned",
  "accepted",
  "in_progress",
  "waiting",
  "resolved",
  "approved",
  "cancelled",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

/** Statuses that still need someone to do something. Drives "open" counts. */
export const OPEN_STATUSES: readonly CaseStatus[] = [
  "new",
  "reviewing",
  "assigned",
  "accepted",
  "in_progress",
  "waiting",
];

/** Work is finished; only these count towards resolved-this-month. */
export const CLOSED_STATUSES: readonly CaseStatus[] = ["resolved", "approved"];

/** Statuses a contractor is allowed to move a task into over a secure link. */
export const CONTRACTOR_STATUSES: readonly CaseStatus[] = [
  "accepted",
  "in_progress",
  "waiting",
  "resolved",
];

export const CASE_PRIORITIES = ["low", "normal", "soon", "urgent"] as const;
export type CasePriority = (typeof CASE_PRIORITIES)[number];

/** The three options a guest sees. Managers can additionally set "normal". */
export const GUEST_PRIORITIES = ["low", "soon", "urgent"] as const;

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

export type Plan = "trial" | "pro" | "none";
export type UnitBand = "1-5" | "6-20" | "21-50" | "51-200" | "200+";

/**
 * "company" is a management or rental business with staff and many properties.
 * "private" is an individual renting out their own home or holiday let, which
 * changes the wording in the app: no colleagues, no organisation, fewer roles.
 */
export const ACCOUNT_TYPES = ["company", "private"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface Organization extends BaseRecord {
  accountType: AccountType;
  name: string;
  supportEmail: string;
  supportPhone: string;
  emergencyPhone: string;
  plan: Plan;
  trialEndsAt?: string;
  billed: boolean;
  qrAllowance: number;
  onboardingBookedAt?: string;
}

export interface Profile extends BaseRecord {
  organizationId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  phoneCountry: string;
  country: string;
  locale: string;
  unitBand: UnitBand;
  marketingConsent: boolean;
  emailVerifiedAt?: string;
  onboardingCompletedAt?: string;
  passwordHash?: string;
}

export interface VerificationToken extends BaseRecord {
  profileId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt?: string;
}

export interface AdminNotice extends BaseRecord {
  type: "signup";
  emailMasked: string;
  companyName: string;
  locale: string;
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
  lat?: number;
  lng?: number;
  notes?: string;
  documents: PropertyDocument[];
  inspectionPhotos: InspectionPhoto[];
  guestReady?: boolean;
  nextCheckoutAt?: string;
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
  originalText?: string;
  originalLocale?: string;
  translated?: boolean;
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
  /** Unguessable link handed to the assigned contractor. Cleared on unassign. */
  workToken?: string;
  contractorAcceptedAt?: string;
  contractorDeclinedAt?: string;
  declineReason?: string;
  approvedAt?: string;
  /** Manager instructions shown to the contractor. Never shown to guests/owners. */
  workInstructions?: string;
}

/** Manager-only. Never rendered on guest, contractor or owner surfaces. */
export interface CaseNote extends BaseRecord {
  caseId: string;
  organizationId: string;
  authorName: string;
  text: string;
}

export interface CaseWithRelations extends MaintenanceCase {
  property: Property;
  contractor?: Contractor;
  attachments: Attachment[];
  messages: CaseMessage[];
  activity: ActivityLog[];
  notes: CaseNote[];
}

export const NOTIFICATION_KINDS = [
  "case_new",
  "case_urgent",
  "contractor_accepted",
  "contractor_declined",
  "contractor_completed",
  "cleaning_started",
  "cleaning_completed",
  "cleaning_damage",
  "property_ready",
  "case_approved",
  "case_reopened",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export interface Notification extends BaseRecord {
  organizationId: string;
  kind: NotificationKind;
  /** Pre-rendered title/body in the organisation's language. */
  title: string;
  body: string;
  href: string;
  read: boolean;
}

/**
 * Revocable read-only link for a property owner. Deliberately scoped to one
 * property so an owner can never see another owner's portfolio.
 */
export interface OwnerAccess extends BaseRecord {
  organizationId: string;
  propertyId: string;
  token: string;
  ownerName: string;
  ownerEmail: string;
  active: boolean;
}

export interface PilotLead extends BaseRecord {
  name: string;
  company: string;
  email: string;
  phone: string;
  region: string;
  propertyCount: string;
  rentalType: string;
  currentMethod: string;
  mostValuable: string;
  message?: string;
  accountType?: "company" | "private";
  wantsPilot: boolean;
  consent: boolean;
  locale: string;
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

export const CLEANING_STATUSES = [
  "scheduled",
  "accepted",
  "in_progress",
  "completed",
  "returned",
  "approved",
] as const;
export type CleaningStatus = (typeof CLEANING_STATUSES)[number];

export const CLEANING_ISSUE_KINDS = ["damage", "missing", "repair"] as const;
export type CleaningIssueKind = (typeof CLEANING_ISSUE_KINDS)[number];

export interface Cleaner extends BaseRecord {
  organizationId: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
}

export interface CleaningChecklistItem {
  id: string;
  key: string;
  label: string;
  done: boolean;
  doneAt?: string;
}

export interface CleaningPhoto extends BaseRecord {
  jobId: string;
  kind: "before" | "after";
  url: string;
  caption?: string;
}

export interface CleaningIssue extends BaseRecord {
  jobId: string;
  kind: CleaningIssueKind;
  text: string;
  convertedCaseId?: string;
}

export interface CleaningJob extends BaseRecord {
  organizationId: string;
  propertyId: string;
  cleanerId?: string;
  accessToken: string;
  status: CleaningStatus;
  scheduledAt: string;
  instructions: string;
  checklist: CleaningChecklistItem[];
  completedAt?: string;
  approvedAt?: string;
  returnedAt?: string;
  returnComment?: string;
  guestCheckoutAt?: string;
  scheduleId?: string;
}

export interface CleaningSchedule extends BaseRecord {
  organizationId: string;
  propertyId: string;
  cleanerId?: string;
  afterCheckout: boolean;
  offsetHours: number;
  instructions: string;
  active: boolean;
}

export interface CleaningNotification extends BaseRecord {
  organizationId: string;
  jobId: string;
  propertyName: string;
  read: boolean;
}

export interface CleaningJobWithRelations extends CleaningJob {
  property: Property;
  cleaner?: Cleaner;
  photos: CleaningPhoto[];
  issues: CleaningIssue[];
}

export type LocalizedText = {
  sv?: string;
  en?: string;
  es?: string;
  [locale: string]: string | undefined;
};

export const PLACE_CATEGORIES = [
  "restaurants",
  "cafes",
  "groceries",
  "taxi",
  "boats",
  "carrental",
  "beaches",
  "golf",
  "activities",
  "shopping",
  "nightlife",
  "health",
  "kids",
  "delivery",
  "gym",
] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export const MONETIZATION_KINDS = [
  "none",
  "affiliate",
  "booking",
  "paid",
  "sponsored",
] as const;
export type MonetizationKind = (typeof MONETIZATION_KINDS)[number];

export const GUIDE_EVENT_KINDS = [
  "scan",
  "click_place",
  "click_whatsapp",
  "click_maps",
  "click_book",
  "click_website",
  "click_discount",
  "click_phone",
] as const;
export type GuideEventKind = (typeof GUIDE_EVENT_KINDS)[number];

export interface ContactNumber {
  id: string;
  label: LocalizedText;
  phone: string;
}

export interface ApplianceNote {
  id: string;
  key: string;
  title: LocalizedText;
  text: LocalizedText;
}

export interface PropertyGuide extends BaseRecord {
  propertyId: string;
  organizationId: string;
  welcome: LocalizedText;
  wifiName: string;
  wifiPassword: string;
  checkIn: string;
  checkOut: string;
  houseRules: LocalizedText;
  parking: LocalizedText;
  waste: LocalizedText;
  appliances: ApplianceNote[];
  importantNumbers: ContactNumber[];
  emergency: LocalizedText;
  categoryOrder: PlaceCategory[];
}

export interface PlaceMonetization {
  kind: MonetizationKind;
  trackingCode?: string;
  affiliateUrl?: string;
}

export interface Place extends BaseRecord {
  organizationId: string;
  category: PlaceCategory;
  name: string;
  description: LocalizedText;
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
  sponsored: boolean;
  monetization: PlaceMonetization;
}

export interface PropertyPlace extends BaseRecord {
  propertyId: string;
  placeId: string;
  sortOrder: number;
  enabled: boolean;
}

export interface PropertyPlaceWithPlace extends PropertyPlace {
  place: Place;
}

export interface GuideEvent {
  id: string;
  createdAt: string;
  organizationId: string;
  propertyId: string;
  placeId?: string;
  kind: GuideEventKind;
}

export interface GuideAnalytics {
  scans: number;
  clicks: number;
  byPlace: {
    placeId: string;
    name: string;
    clicks: number;
    bookings: number;
    sponsored: boolean;
  }[];
  byKind: { kind: GuideEventKind; count: number }[];
}
