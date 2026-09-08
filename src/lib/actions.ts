"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { roleHome } from "@/lib/access/roles";
import {
  LOGIN_LIMIT,
  LOGIN_WINDOW_MS,
  PASSWORD_RESET_TTL_HOURS,
  REPORT_LIMIT,
  REPORT_WINDOW_MS,
} from "@/lib/constants";
import { isPublicProductDemo } from "@/lib/public-demo";
import { randomToken } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security/events";
import { assertSameOrigin, honeypotFilled, requestIp } from "@/lib/security/request";
import { hydrateAccountSnapshot } from "@/lib/account-snapshot";
import {
  addAfterPhotos,
  addCaseNote,
  addMessage,
  approveCase,
  authenticate,
  canAddProperty,
  createPasswordResetToken,
  createProperty,
  createManagerCase,
  consumePasswordResetToken,
  getActiveMembership,
  getOrganizationLocale,
  getProfile,
  getProfileByEmail,
  markInboxRead,
  markNotificationsRead,
  pushNotification,
  registerAccount,
  reopenCase,
  rotateWorkToken,
  savePayPerHomeMonth,
  setCaseWorkOrder,
  submitReport,
  tenantConfirm,
  updateCasePriority,
  updateCaseStatus,
  updateCaseDetails,
  updateOrganization,
  setProfilePassword,
  updateProfile,
} from "@/lib/data/store";
import { priorityLabel, statusLabel } from "@/lib/labels";
import { clearSession, requireHostSession, setSession } from "@/lib/session";
import {
  CASE_CATEGORIES,
  CASE_PRIORITIES,
  CASE_STATUSES,
  GUEST_PRIORITIES,
  type CaseCategory,
  type CasePriority,
  type CaseStatus,
} from "@/lib/types";
import { parsePropertyType } from "@/lib/types";
import { parsePhotoPayload } from "@/lib/uploads";
import { isValidEmail } from "@/lib/utils";
import { z } from "zod";

const reportSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  reporterName: z.string().trim().min(1).max(120),
  reporterPhone: z.string().trim().min(1).max(40),
  reporterEmail: z.string().trim().email().max(200),
});
import { notifyReporter } from "@/lib/case-notify";

function revalidateAll() {
  revalidatePath("/", "layout");
}

function safeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/app";
  }
  return value;
}

export async function loginAction(
  _prev: { error?: string } | null,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? "/app"));
  if (!(await assertSameOrigin())) return { error: "generic" };
  const ip = await requestIp();
  if (!rateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS).ok) {
    logSecurityEvent("rate_limited", { subject: "login" });
    return { error: "login" };
  }
  await hydrateAccountSnapshot();
  const profile = authenticate(email, password);
  if (!profile) {
    logSecurityEvent("login_failed");
    return { error: "login" };
  }
  if (!profile.emailVerifiedAt) {
    return { error: "unverified" };
  }
  try {
    await setSession({
      profileId: profile.id,
      organizationId: profile.organizationId,
    });
  } catch {
    return { error: "generic" };
  }
  const membership = getActiveMembership(profile.id, profile.organizationId, "host")
    ?? getActiveMembership(profile.id, profile.organizationId);
  logSecurityEvent("login_ok", { subject: membership?.role ?? "host" });
  redirect(membership ? (next === "/app" ? roleHome(membership.role) : next) : roleHome("host"));
}

export async function logoutAction() {
  await clearSession();
  logSecurityEvent("logout");
  redirect("/");
}

export async function registerAction(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const organizationName = String(formData.get("organizationName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!fullName || !email || !password || !organizationName) {
    return { error: "Fyll i alla obligatoriska fält" };
  }
  if (!isValidEmail(email)) return { error: "Ange en giltig e-postadress" };
  if (password.length < 6) return { error: "Lösenordet behöver minst 6 tecken" };
  try {
    const profile = registerAccount({
      fullName,
      email,
      phone,
      password,
      organizationName,
    });
    await setSession({
      profileId: profile.id,
      organizationId: profile.organizationId,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Kunde inte skapa konto" };
  }
  redirect("/app");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!isValidEmail(email)) return { error: "Ange en giltig e-postadress" };
  const ip = await requestIp();
  if (!rateLimit(`forgot:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS).ok) {
    logSecurityEvent("rate_limited", { subject: "forgot" });
    return { ok: true as const };
  }
  const profile = getProfileByEmail(email);
  if (profile) {
    const raw = randomToken(32);
    createPasswordResetToken(profile.id, raw);
    logSecurityEvent("password_reset_requested");
    const { sendAccessEmail } = await import("@/lib/email/send");
    const dict = await getDictionary(profile.locale || "sv");
    const { requestUrl } = await import("@/lib/request-origin");
    const url = await requestUrl(`/reset/${encodeURIComponent(raw)}`);
    await sendAccessEmail({
      to: profile.email,
      subject: dict.forgot.title,
      title: dict.forgot.title,
      body: dict.forgot.body,
      cta: dict.forgot.submit,
      url,
      ttl: `${PASSWORD_RESET_TTL_HOURS}h`,
      dict,
    });
  }
  return { ok: true as const };
}

export async function resetPasswordAction(
  _prev: { error?: string } | null,
  formData: FormData,
) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "password" };
  if (password !== confirm) return { error: "mismatch" };
  const profile = consumePasswordResetToken(token);
  if (!profile) return { error: "generic" };
  setProfilePassword(profile.id, password);
  logSecurityEvent("password_changed");
  return { error: undefined as string | undefined, ok: true as const };
}

export async function createPropertyAction(formData: FormData) {
  const session = await requireHostSession();
  const profile = getProfile(session.profileId);
  const dict = await getDictionary(profile?.locale || "sv");
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const country = String(formData.get("country") ?? "Sverige").trim();
  const tenantName =
    String(formData.get("tenantName") ?? "").trim() || dict.propertyForm.tenantDefault;
  if (!name || !address || !city) {
    return { error: "required" };
  }
  if (!canAddProperty(session.organizationId)) {
    return { error: "propertyLimit" };
  }
  const property = createProperty(session.organizationId, {
    name,
    address,
    city,
    country,
    countryCode: country.toLowerCase() === "spanien" ? "ES" : "SE",
    imageUrl:
      String(formData.get("imageUrl") ?? "").trim() ||
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80",
    type: parsePropertyType(String(formData.get("type") ?? "")),
    sqm: Number(formData.get("sqm") ?? 0) || 0,
    rooms: Number(formData.get("rooms") ?? 0) || 0,
    tenantName,
    tenantEmail: String(formData.get("tenantEmail") ?? "").trim(),
    tenantPhone: String(formData.get("tenantPhone") ?? "").trim(),
    leaseStart: String(formData.get("leaseStart") ?? new Date().toISOString()),
    leaseEnd: String(formData.get("leaseEnd") ?? new Date().toISOString()),
    lastInspection: new Date().toISOString(),
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  });
  revalidateAll();
  redirect(`/app/properties/${property.id}`);
}

export async function submitReportAction(formData: FormData) {
  if (honeypotFilled(formData)) {
    redirect("/t/ok?new=1");
  }
  const ip = await requestIp();
  if (!rateLimit(`report:${ip}`, REPORT_LIMIT, REPORT_WINDOW_MS).ok) {
    logSecurityEvent("rate_limited", { subject: "report" });
    return { error: "generic" };
  }
  const category = String(formData.get("category") ?? "other") as CaseCategory;
  const priority = String(formData.get("priority") ?? "soon") as CasePriority;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!CASE_CATEGORIES.includes(category)) return { error: "category" };
  if (!GUEST_PRIORITIES.includes(priority as (typeof GUEST_PRIORITIES)[number])) {
    return { error: "priority" };
  }
  const fields = reportSchema.safeParse({
    title,
    description,
    reporterName: String(formData.get("reporterName") ?? ""),
    reporterPhone: String(formData.get("reporterPhone") ?? ""),
    reporterEmail: String(formData.get("reporterEmail") ?? ""),
  });
  if (!fields.success) return { error: "required" };

  const parsed = parsePhotoPayload(formData.get("photos"));
  if (!parsed.ok) return { error: parsed.reason };

  const propertyToken = String(formData.get("propertyToken") ?? "");
  if (isPublicProductDemo(propertyToken)) {
    redirect("/t/ok?new=1");
  }

  let trackToken: string;
  try {
    const created = submitReport({
      propertyToken,
      category,
      priority,
      title: fields.data.title,
      description: fields.data.description,
      discoveredAt: String(formData.get("discoveredAt") ?? new Date().toISOString()),
      stillOngoing: String(formData.get("stillOngoing") ?? "true") === "true",
      reporterName: fields.data.reporterName,
      reporterPhone: fields.data.reporterPhone,
      reporterEmail: fields.data.reporterEmail,
      photos: parsed.photos,
      locale: String(formData.get("locale") ?? "sv"),
    });
    const orgDict = await getDictionary(getOrganizationLocale(created.organizationId));
    const urgent = created.priority === "urgent";
    pushNotification({
      organizationId: created.organizationId,
      kind: urgent ? "case_urgent" : "case_new",
      title: urgent ? orgDict.notifications.caseUrgent : orgDict.notifications.caseNew,
      body: `${created.reference} · ${created.property.name}`,
      href: `/app/cases/${created.id}`,
    });
    trackToken = created.trackToken;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "generic" };
  }

  revalidateAll();
  // Outside the try block: redirect() signals by throwing, and a catch here
  // would swallow it and leave the guest on the form.
  redirect(`/t/${trackToken}?new=1`);
}

/** Resolves the acting manager's name and their dictionary in one go. */
async function actingManager(profileId: string) {
  const profile = getProfile(profileId);
  const dict = await getDictionary(profile?.locale || (await getLocale()));
  return { name: profile?.fullName ?? "Förvaltare", dict, profile };
}

export async function changeStatusAction(formData: FormData) {
  const session = await requireHostSession();
  const { name, dict } = await actingManager(session.profileId);
  const status = String(formData.get("status") ?? "") as CaseStatus;
  if (!CASE_STATUSES.includes(status)) return { error: "status" };
  updateCaseStatus(
    session.organizationId,
    String(formData.get("caseId") ?? ""),
    status,
    name,
    statusLabel(dict, status),
  );
  await notifyReporter(session.organizationId, String(formData.get("caseId") ?? ""), status);
  revalidateAll();
}

export async function changePriorityAction(formData: FormData) {
  const session = await requireHostSession();
  const { name, dict } = await actingManager(session.profileId);
  const priority = String(formData.get("priority") ?? "") as CasePriority;
  if (!CASE_PRIORITIES.includes(priority)) return { error: "priority" };
  updateCasePriority(
    session.organizationId,
    String(formData.get("caseId") ?? ""),
    priority,
    name,
    priorityLabel(dict, priority),
  );
  revalidateAll();
}

export async function saveCaseDetailsAction(formData: FormData) {
  const session = await requireHostSession();
  const { name } = await actingManager(session.profileId);
  const dueRaw = String(formData.get("dueAt") ?? "").trim();
  const costRaw = String(formData.get("costEstimate") ?? "").trim();
  const dueAt = dueRaw ? new Date(dueRaw).toISOString() : null;
  const costEstimate = costRaw === "" ? null : Number(costRaw);
  if (costEstimate !== null && (!Number.isFinite(costEstimate) || costEstimate < 0)) {
    return { error: "generic" as const };
  }
  updateCaseDetails(
    session.organizationId,
    String(formData.get("caseId") ?? ""),
    { dueAt, costEstimate },
    name,
  );
  revalidateAll();
}

export async function assignContractorAction(formData: FormData) {
  const session = await requireHostSession();
  const { name } = await actingManager(session.profileId);
  const contractorId = String(formData.get("contractorId") ?? "");
  const instructions = formData.get("instructions");
  try {
    setCaseWorkOrder({
      organizationId: session.organizationId,
      caseId: String(formData.get("caseId") ?? ""),
      contractorId: contractorId || undefined,
      instructions: instructions === null ? undefined : String(instructions),
      actorName: name,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "assign" };
  }
  revalidateAll();
}

export async function rotateWorkTokenAction(formData: FormData) {
  const session = await requireHostSession();
  rotateWorkToken(session.organizationId, String(formData.get("caseId") ?? ""));
  revalidateAll();
}

export async function addCaseNoteAction(formData: FormData) {
  const session = await requireHostSession();
  const { name } = await actingManager(session.profileId);
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "empty" };
  if (text.length > 2000) return { error: "long" };
  addCaseNote(session.organizationId, String(formData.get("caseId") ?? ""), name, text);
  revalidateAll();
}

export async function approveCaseAction(formData: FormData) {
  const session = await requireHostSession();
  const { name, dict } = await actingManager(session.profileId);
  const caseId = String(formData.get("caseId") ?? "");
  const item = approveCase(session.organizationId, caseId, name);
  pushNotification({
    organizationId: session.organizationId,
    kind: "case_approved",
    title: dict.notifications.caseApproved,
    body: `${item.reference} · ${item.property.name}`,
    href: `/app/cases/${item.id}`,
  });
  await notifyReporter(session.organizationId, caseId, item.status);
  revalidateAll();
}

export async function reopenCaseAction(formData: FormData) {
  const session = await requireHostSession();
  const { name, dict } = await actingManager(session.profileId);
  const caseId = String(formData.get("caseId") ?? "");
  const item = reopenCase(session.organizationId, caseId, name);
  pushNotification({
    organizationId: session.organizationId,
    kind: "case_reopened",
    title: dict.notifications.caseReopened,
    body: `${item.reference} · ${item.property.name}`,
    href: `/app/cases/${item.id}`,
  });
  await notifyReporter(session.organizationId, caseId, item.status);
  revalidateAll();
}

export async function markNotificationsReadAction(formData: FormData) {
  const session = await requireHostSession();
  const id = String(formData.get("id") ?? "");
  markNotificationsRead(session.organizationId, id || undefined);
  revalidateAll();
}

export async function sendOwnerMessageAction(formData: FormData) {
  const session = await requireHostSession();
  const profile = getProfile(session.profileId);
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;
  addMessage({
    caseId: String(formData.get("caseId") ?? ""),
    organizationId: session.organizationId,
    author: "owner",
    authorName: profile?.fullName ?? "Förvaltare",
    text,
    locale: profile?.locale,
  });
  revalidateAll();
}

export async function sendTenantMessageAction(formData: FormData) {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;
  addMessage({
    caseId: String(formData.get("caseId") ?? ""),
    trackToken: String(formData.get("trackToken") ?? ""),
    author: "tenant",
    authorName: String(formData.get("authorName") ?? "Hyresgäst"),
    text,
    locale: String(formData.get("locale") ?? "sv"),
  });
  revalidateAll();
}

export async function markResolvedAction(formData: FormData) {
  const session = await requireHostSession();
  const profile = getProfile(session.profileId);
  updateCaseStatus(
    session.organizationId,
    String(formData.get("caseId") ?? ""),
    "resolved",
    profile?.fullName ?? "Förvaltare",
  );
  revalidateAll();
}

export async function addAfterPhotosAction(formData: FormData) {
  const session = await requireHostSession();
  const profile = getProfile(session.profileId);
  const photosRaw = String(formData.get("photos") ?? "[]");
  let photos: { url: string; caption?: string }[] = [];
  try {
    photos = JSON.parse(photosRaw) as { url: string; caption?: string }[];
  } catch {
    photos = [];
  }
  if (!photos.length) return { error: "Välj minst en bild" };
  addAfterPhotos(
    session.organizationId,
    String(formData.get("caseId") ?? ""),
    photos,
    profile?.fullName ?? "Förvaltare",
  );
  revalidateAll();
}

export async function tenantConfirmAction(formData: FormData) {
  tenantConfirm(
    String(formData.get("trackToken") ?? ""),
    String(formData.get("authorName") ?? "Hyresgäst"),
  );
  revalidateAll();
}

export async function markThreadReadAction(caseId: string) {
  const session = await requireHostSession();
  markInboxRead(session.organizationId, caseId);
  revalidateAll();
}

export async function createManagerCaseAction(formData: FormData) {
  const session = await requireHostSession();
  const profile = getProfile(session.profileId);
  const category = String(formData.get("category") ?? "other") as CaseCategory;
  const priority = String(formData.get("priority") ?? "normal") as CasePriority;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const propertyId = String(formData.get("propertyId") ?? "").trim();

  if (!CASE_CATEGORIES.includes(category)) redirect("/app/cases/new");
  if (!CASE_PRIORITIES.includes(priority)) redirect("/app/cases/new");
  if (!title || !description || !propertyId) redirect("/app/cases/new");

  const created = createManagerCase({
    organizationId: session.organizationId,
    propertyId,
    category,
    priority,
    title: title.slice(0, 200),
    description: description.slice(0, 5000),
    reporterName: profile?.fullName || "Förvaltare",
  });
  const orgDict = await getDictionary(getOrganizationLocale(created.organizationId));
  const urgent = created.priority === "urgent";
  pushNotification({
    organizationId: created.organizationId,
    kind: urgent ? "case_urgent" : "case_new",
    title: urgent ? orgDict.notifications.caseUrgent : orgDict.notifications.caseNew,
    body: `${created.reference} · ${created.property.name}`,
    href: `/app/cases/${created.id}`,
  });
  revalidateAll();
  redirect(`/app/cases/${created.id}`);
}

export async function updateSettingsAction(formData: FormData) {
  const session = await requireHostSession();
  updateOrganization(session.organizationId, {
    name: String(formData.get("organizationName") ?? "").trim(),
    supportEmail: String(formData.get("supportEmail") ?? "").trim(),
    supportPhone: String(formData.get("supportPhone") ?? "").trim(),
    emergencyPhone: String(formData.get("emergencyPhone") ?? "").trim(),
  });
  updateProfile(session.profileId, {
    fullName: String(formData.get("fullName") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
  });
  revalidateAll();
  redirect("/app/settings?saved=1");
}

const PAY_BANDS = ["under10", "10-14", "14-20", "20plus", "unsure"] as const;

export async function savePayPerHomeAction(formData: FormData) {
  const session = await requireHostSession();
  const value = String(formData.get("payPerHomeMonth") ?? "").trim();
  if (!PAY_BANDS.includes(value as (typeof PAY_BANDS)[number])) {
    redirect("/app/settings#billing");
  }
  savePayPerHomeMonth(session.organizationId, value);
  revalidateAll();
  redirect("/app/settings?saved=1#billing");
}

export async function updateNotificationSettingsAction(formData: FormData) {
  const session = await requireHostSession();
  updateProfile(session.profileId, {
    marketingConsent: formData.get("marketingConsent") === "on",
    notifyCases: formData.get("notifyCases") === "on",
    notifyCleaning: formData.get("notifyCleaning") === "on",
    notifyUrgent: formData.get("notifyUrgent") === "on",
  });
  revalidateAll();
  redirect("/app/settings?saved=1");
}
