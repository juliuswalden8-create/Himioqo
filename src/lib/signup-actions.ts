"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  EMAIL_FLASH_COOKIE,
  LOCALE_COOKIE,
  PENDING_SIGNUP_COOKIE,
  REGISTER_LIMIT,
  REGISTER_WINDOW_MS,
  RESEND_LIMIT,
  RESEND_WINDOW_MS,
} from "@/lib/constants";
import { clearAccountSnapshot, saveAccountSnapshot } from "@/lib/account-snapshot";
import {
  addContractor,
  bookOnboarding,
  completeOnboarding,
  consumeVerificationToken,
  createProperty,
  createVerificationToken,
  deleteAccount,
  exportAccount,
  getOrganization,
  getProfile,
  peekDevVerifyToken,
  registerTrialAccount,
  setProfilePassword,
  updateProfile,
  updateSignupEmail,
} from "@/lib/data/store";
import { sendAdminSignupNotice, sendWelcomeEmail } from "@/lib/email/send";
import { getDictionary } from "@/i18n/get-dictionary";
import { normalizeLocale } from "@/lib/i18n/languages";
import { validatePhone, toE164 } from "@/lib/phone";
import { getPendingSignup } from "@/lib/pending";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestOrigin } from "@/lib/request-origin";
import { encodeSignupTicket, ticketFromProfile } from "@/lib/signup-ticket";
import { isValidEmail } from "@/lib/utils";
import { clearSession, getSession, requireSession, setSession } from "@/lib/session";
import type { CountryCode } from "libphonenumber-js";
import type { AccountType, UnitBand } from "@/lib/types";
import { ACCOUNT_TYPES } from "@/lib/types";

async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

async function setPendingCookies(token: string, email: string) {
  const jar = await cookies();
  jar.set(PENDING_SIGNUP_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  jar.set(EMAIL_FLASH_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60,
  });
}

async function issueAndSend(profileId: string) {
  const profile = getProfile(profileId);
  if (!profile) throw new Error("missing");
  const org = getOrganization(profile.organizationId);
  if (!org) throw new Error("missing");
  const token = encodeSignupTicket(ticketFromProfile(profile, org));
  createVerificationToken(profile.id, token);
  const dict = await getDictionary(profile.locale);
  const origin = await getRequestOrigin();
  const verifyUrl = `${origin}/verify/${token}`;
  await sendWelcomeEmail({
    to: profile.email,
    dict,
    firstName: profile.firstName,
    verifyUrl,
    locale: profile.locale,
    logoUrl: `${origin}/brand/logo-email.png`,
  });
  await sendAdminSignupNotice({
    dict,
    companyName: org.name,
    emailMasked: profile.email.replace(/^(.).+(@.*)$/, "$1***$2"),
    locale: profile.locale,
  });
  return { token, verifyUrl };
}

export async function setLocaleAction(locale: string) {
  const code = normalizeLocale(locale);
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, code, {
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  const session = await getSession();
  if (session) {
    try {
      updateProfile(session.profileId, { locale: code });
    } catch {
      /* guest locale cookie is enough */
    }
  }
  revalidatePath("/", "layout");
}

export async function registerTrialAction(_prev: { error?: string } | null, formData: FormData) {
  const honeypot = String(formData.get("companyWebsite") ?? "");
  const loadedAt = Number(formData.get("formLoadedAt") ?? 0);
  if (honeypot) return { error: "spam" };
  if (loadedAt && Date.now() - loadedAt < 1200) return { error: "spam" };

  const ip = await clientKey();
  const limit = rateLimit(`reg:${ip}`, REGISTER_LIMIT, REGISTER_WINDOW_MS);
  if (!limit.ok) return { error: "rate" };

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const phoneCountry = String(formData.get("phoneCountry") ?? "SE") as CountryCode;
  const country = String(formData.get("country") ?? "SE").trim();
  const locale = normalizeLocale(String(formData.get("locale") ?? "sv"));
  const unitBand = String(formData.get("unitBand") ?? "1-5") as UnitBand;
  const terms = String(formData.get("terms") ?? "") === "on";
  const marketingConsent = String(formData.get("marketing") ?? "") === "on";

  const requestedType = String(formData.get("accountType") ?? "company");
  const accountType: AccountType = ACCOUNT_TYPES.includes(requestedType as AccountType)
    ? (requestedType as AccountType)
    : "company";

  // A private landlord has no company, so their own name becomes the workspace
  // name and the field is not required.
  const organizationName =
    accountType === "private" ? company || `${firstName} ${lastName}`.trim() : company;

  if (!firstName || !lastName || !email || !phoneRaw || !country || !locale) {
    return { error: "required" };
  }
  if (accountType === "company" && !company) return { error: "required" };
  if (!isValidEmail(email)) return { error: "email" };
  if (!validatePhone(phoneCountry, phoneRaw)) return { error: "phone" };
  if (!terms) return { error: "terms" };

  const phone = toE164(phoneCountry, phoneRaw);
  if (!phone) return { error: "phone" };

  let profile;
  try {
    profile = registerTrialAccount({
      firstName,
      lastName,
      email,
      phone,
      phoneCountry,
      country,
      locale,
      unitBand,
      marketingConsent,
      organizationName,
      accountType,
    });
  } catch (error) {
    return { error: error instanceof Error && error.message === "exists" ? "exists" : "generic" };
  }

  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  const issued = await issueAndSend(profile.id);
  await setPendingCookies(issued.token, profile.email);
  redirect("/register/check-email?sent=1");
}

export async function resendVerificationAction() {
  const pending = await getPendingSignup();
  if (!pending) return { error: "generic" };
  const ip = await clientKey();
  const byIp = rateLimit(`resend-ip:${ip}`, RESEND_LIMIT, RESEND_WINDOW_MS);
  const byEmail = rateLimit(`resend-em:${pending.profile.email}`, RESEND_LIMIT, RESEND_WINDOW_MS);
  if (!byIp.ok || !byEmail.ok) return { error: "rate" };
  const issued = await issueAndSend(pending.profile.id);
  await setPendingCookies(issued.token, pending.profile.email);
  return { ok: true as const };
}

export async function changeSignupEmailAction(_prev: { error?: string } | null, formData: FormData) {
  const pending = await getPendingSignup();
  if (!pending) return { error: "generic" };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) return { error: "email" };
  const ip = await clientKey();
  if (!rateLimit(`change:${ip}`, RESEND_LIMIT, RESEND_WINDOW_MS).ok) return { error: "rate" };
  try {
    const profile = updateSignupEmail(pending.profile.id, email);
    const issued = await issueAndSend(profile.id);
    await setPendingCookies(issued.token, profile.email);
  } catch (error) {
    return { error: error instanceof Error && error.message === "exists" ? "exists" : "generic" };
  }
  redirect("/register/check-email?sent=1");
}

export async function setPasswordAfterVerifyAction(_prev: { error?: string } | null, formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "password" };
  if (password !== confirm) return { error: "mismatch" };
  const profile = (token ? consumeVerificationToken(token) : null) ?? getProfile(profileId);
  if (!profile?.emailVerifiedAt) return { error: "token" };
  setProfilePassword(profile.id, password);
  const updated = getProfile(profile.id);
  if (updated) await saveAccountSnapshot(updated);
  await setSession({ profileId: profile.id, organizationId: profile.organizationId });
  redirect("/onboarding");
}

export async function finishOnboardingAction() {
  const session = await requireSession();
  completeOnboarding(session.profileId);
  redirect("/app");
}

export async function bookOnboardingAction() {
  const session = await requireSession();
  bookOnboarding(session.organizationId);
  revalidatePath("/", "layout");
}

export async function onboardingPropertyAction(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const tenantName = String(formData.get("tenantName") ?? "").trim();
  if (!name || !address || !city || !tenantName) {
    redirect("/onboarding?step=1");
  }
  createProperty(session.organizationId, {
    name,
    address,
    city,
    country: "Sverige",
    countryCode: "SE",
    imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80",
    type: "apartment",
    sqm: 0,
    rooms: 0,
    tenantName,
    tenantEmail: "",
    tenantPhone: "",
    leaseStart: new Date().toISOString(),
    leaseEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    lastInspection: new Date().toISOString(),
  });
  redirect("/onboarding?step=2");
}

export async function onboardingContractorAction(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  if (!name || !contactName) {
    redirect("/onboarding?step=3");
  }
  addContractor(session.organizationId, {
    name,
    contactName,
    trade: String(formData.get("trade") ?? "").trim() || "Allmänt",
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
  });
  redirect("/onboarding?step=4");
}

export async function exportDataAction() {
  const session = await requireSession();
  return exportAccount(session.organizationId);
}

export async function deleteAccountAction() {
  const session = await requireSession();
  deleteAccount(session.organizationId);
  await clearAccountSnapshot();
  await clearSession();
  redirect("/");
}

export async function consumeFlashEmail() {
  const jar = await cookies();
  const value = jar.get(EMAIL_FLASH_COOKIE)?.value;
  if (value) jar.delete(EMAIL_FLASH_COOKIE);
  return value ?? null;
}

export async function pendingProfileId() {
  return (await getPendingSignup())?.profile.id ?? null;
}

export async function devVerifyLink(profileId: string) {
  if (process.env.RESEND_API_KEY) return null;
  const token = peekDevVerifyToken(profileId);
  return token ? `${await getRequestOrigin()}/verify/${token}` : null;
}

export { consumeVerificationToken };
