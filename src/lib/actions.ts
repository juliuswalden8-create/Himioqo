"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/constants";
import { hydrateAccountSnapshot } from "@/lib/account-snapshot";
import {
  addAfterPhotos,
  addCaseNote,
  addMessage,
  approveCase,
  authenticate,
  createProperty,
  createManagerCase,
  getOrganizationLocale,
  getProfile,
  markInboxRead,
  markNotificationsRead,
  pushNotification,
  registerAccount,
  reopenCase,
  rotateWorkToken,
  setCaseWorkOrder,
  submitReport,
  tenantConfirm,
  updateCasePriority,
  updateCaseStatus,
  updateOrganization,
  updateProfile,
} from "@/lib/data/store";
import { priorityLabel, statusLabel } from "@/lib/labels";
import { clearSession, requireSession, setSession } from "@/lib/session";
import {
  CASE_CATEGORIES,
  CASE_PRIORITIES,
  CASE_STATUSES,
  GUEST_PRIORITIES,
  type CaseCategory,
  type CasePriority,
  type CaseStatus,
  type PropertyType,
} from "@/lib/types";
import { parsePhotoPayload } from "@/lib/uploads";
import { isValidEmail } from "@/lib/utils";

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
  await hydrateAccountSnapshot();
  const profile = authenticate(email, password);
  if (!profile) {
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
  redirect(next);
}

export async function demoLoginAction() {
  const profile = authenticate(DEMO_EMAIL, DEMO_PASSWORD);
  if (!profile) redirect("/login");
  try {
    await setSession({
      profileId: profile.id,
      organizationId: profile.organizationId,
    });
  } catch {
    redirect("/login");
  }
  redirect("/app");
}

export async function logoutAction() {
  await clearSession();
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
  return { ok: true as const };
}

export async function createPropertyAction(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const country = String(formData.get("country") ?? "Sverige").trim();
  const tenantName = String(formData.get("tenantName") ?? "").trim();
  if (!name || !address || !city || !tenantName) {
    return { error: "Namn, adress, stad och hyresgäst krävs" };
  }
  const type = (String(formData.get("type") ?? "apartment") as PropertyType) || "apartment";
  const property = createProperty(session.organizationId, {
    name,
    address,
    city,
    country,
    countryCode: country.toLowerCase() === "spanien" ? "ES" : "SE",
    imageUrl:
      String(formData.get("imageUrl") ?? "").trim() ||
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80",
    type,
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
  const category = String(formData.get("category") ?? "other") as CaseCategory;
  const priority = String(formData.get("priority") ?? "soon") as CasePriority;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!CASE_CATEGORIES.includes(category)) return { error: "category" };
  if (!GUEST_PRIORITIES.includes(priority as (typeof GUEST_PRIORITIES)[number])) {
    return { error: "priority" };
  }
  if (!title || !description) return { error: "required" };

  const parsed = parsePhotoPayload(formData.get("photos"));
  if (!parsed.ok) return { error: parsed.reason };

  let trackToken: string;
  try {
    const created = submitReport({
      propertyToken: String(formData.get("propertyToken") ?? ""),
      category,
      priority,
      title: title.slice(0, 200),
      description: description.slice(0, 5000),
      discoveredAt: String(formData.get("discoveredAt") ?? new Date().toISOString()),
      stillOngoing: String(formData.get("stillOngoing") ?? "true") === "true",
      reporterName: String(formData.get("reporterName") ?? "").trim().slice(0, 120),
      reporterPhone: String(formData.get("reporterPhone") ?? "").trim().slice(0, 40),
      reporterEmail: String(formData.get("reporterEmail") ?? "").trim().slice(0, 200),
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
  const session = await requireSession();
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
  revalidateAll();
}

export async function changePriorityAction(formData: FormData) {
  const session = await requireSession();
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

export async function assignContractorAction(formData: FormData) {
  const session = await requireSession();
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
  const session = await requireSession();
  rotateWorkToken(session.organizationId, String(formData.get("caseId") ?? ""));
  revalidateAll();
}

export async function addCaseNoteAction(formData: FormData) {
  const session = await requireSession();
  const { name } = await actingManager(session.profileId);
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "empty" };
  if (text.length > 2000) return { error: "long" };
  addCaseNote(session.organizationId, String(formData.get("caseId") ?? ""), name, text);
  revalidateAll();
}

export async function approveCaseAction(formData: FormData) {
  const session = await requireSession();
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
  revalidateAll();
}

export async function reopenCaseAction(formData: FormData) {
  const session = await requireSession();
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
  revalidateAll();
}

export async function markNotificationsReadAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  markNotificationsRead(session.organizationId, id || undefined);
  revalidateAll();
}

export async function sendOwnerMessageAction(formData: FormData) {
  const session = await requireSession();
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
  const session = await requireSession();
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
  const session = await requireSession();
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
  const session = await requireSession();
  markInboxRead(session.organizationId, caseId);
  revalidateAll();
}

export async function createManagerCaseAction(formData: FormData) {
  const session = await requireSession();
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
  const session = await requireSession();
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

export async function updateNotificationSettingsAction(formData: FormData) {
  const session = await requireSession();
  updateProfile(session.profileId, {
    marketingConsent: formData.get("marketingConsent") === "on",
    notifyCases: formData.get("notifyCases") === "on",
    notifyCleaning: formData.get("notifyCleaning") === "on",
    notifyUrgent: formData.get("notifyUrgent") === "on",
  });
  revalidateAll();
  redirect("/app/settings?saved=1");
}
