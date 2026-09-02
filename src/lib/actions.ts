"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/constants";
import {
  addAfterPhotos,
  addMessage,
  assignContractor,
  authenticate,
  createProperty,
  getProfile,
  markInboxRead,
  registerAccount,
  submitReport,
  tenantConfirm,
  updateCaseStatus,
  updateOrganization,
  updateProfile,
} from "@/lib/data/store";
import { clearSession, requireSession, setSession } from "@/lib/session";
import type { CaseCategory, CasePriority, CaseStatus, PropertyType } from "@/lib/types";
import { isValidEmail } from "@/lib/utils";

function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/app");
  const profile = authenticate(email, password);
  if (!profile) {
    return { error: "Fel e-post eller lösenord" };
  }
  await setSession({
    profileId: profile.id,
    organizationId: profile.organizationId,
  });
  redirect(next.startsWith("/") ? next : "/app");
}

export async function demoLoginAction() {
  const profile = authenticate(DEMO_EMAIL, DEMO_PASSWORD);
  if (!profile) return { error: "Demokontot saknas" };
  await setSession({
    profileId: profile.id,
    organizationId: profile.organizationId,
  });
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
  const photosRaw = String(formData.get("photos") ?? "[]");
  let photos: { url: string; caption?: string }[] = [];
  try {
    photos = JSON.parse(photosRaw) as { url: string; caption?: string }[];
  } catch {
    photos = [];
  }
  try {
    const created = submitReport({
      propertyToken: String(formData.get("propertyToken") ?? ""),
      category: String(formData.get("category") ?? "other") as CaseCategory,
      priority: String(formData.get("priority") ?? "soon") as CasePriority,
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      discoveredAt: String(formData.get("discoveredAt") ?? new Date().toISOString()),
      stillOngoing: String(formData.get("stillOngoing") ?? "true") === "true",
      reporterName: String(formData.get("reporterName") ?? "").trim(),
      reporterPhone: String(formData.get("reporterPhone") ?? "").trim(),
      reporterEmail: String(formData.get("reporterEmail") ?? "").trim(),
      photos,
    });
    revalidateAll();
    redirect(`/t/${created.trackToken}?new=1`);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Kunde inte skicka anmälan" };
  }
}

export async function changeStatusAction(formData: FormData) {
  const session = await requireSession();
  const profile = getProfile(session.profileId);
  updateCaseStatus(
    session.organizationId,
    String(formData.get("caseId") ?? ""),
    String(formData.get("status") ?? "") as CaseStatus,
    profile?.fullName ?? "Förvaltare",
  );
  revalidateAll();
}

export async function assignContractorAction(formData: FormData) {
  const session = await requireSession();
  const profile = getProfile(session.profileId);
  const contractorId = String(formData.get("contractorId") ?? "");
  assignContractor(
    session.organizationId,
    String(formData.get("caseId") ?? ""),
    contractorId || undefined,
    profile?.fullName ?? "Förvaltare",
  );
  revalidateAll();
}

export async function sendOwnerMessageAction(formData: FormData) {
  const session = await requireSession();
  const profile = getProfile(session.profileId);
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "Skriv ett meddelande" };
  addMessage({
    caseId: String(formData.get("caseId") ?? ""),
    organizationId: session.organizationId,
    author: "owner",
    authorName: profile?.fullName ?? "Förvaltare",
    text,
  });
  revalidateAll();
}

export async function sendTenantMessageAction(formData: FormData) {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "Skriv ett meddelande" };
  addMessage({
    caseId: String(formData.get("caseId") ?? ""),
    trackToken: String(formData.get("trackToken") ?? ""),
    author: "tenant",
    authorName: String(formData.get("authorName") ?? "Hyresgäst"),
    text,
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
  return { ok: true as const };
}
