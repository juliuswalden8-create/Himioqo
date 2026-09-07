"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guestPinMatches, setGuestUnlocked } from "@/lib/access/guest-unlock";
import { canInviteRole } from "@/lib/access/permissions";
import { roleHome } from "@/lib/access/roles";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { interpolate } from "@/i18n/interpolate";
import { LOGIN_INTENTS, STAFF_ROLES, type LoginIntent, type StaffRole } from "@/lib/types";
import { sendAccessEmail } from "@/lib/email/send";
import { requestUrl } from "@/lib/request-origin";
import {
  acceptInvitation,
  authenticate,
  consumeLoginLink,
  createInvitation,
  createLoginLink,
  getActiveMembership,
  getOrganization,
  getProfile,
  getProfileByEmail,
  getPropertyByToken,
  listMembershipsForUser,
  listProperties,
  revokeGuestLink,
  revokeInvitation,
  setGuestLinkExpiry,
  setGuestPin,
  switchActiveMembership,
} from "@/lib/data/store";
import { hydrateAccountSnapshot } from "@/lib/account-snapshot";
import { requireHostSession, requireSession, setSession } from "@/lib/session";
import { sendSms } from "@/lib/sms/send";
import { LOGIN_LIMIT, LOGIN_WINDOW_MS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security/events";
import { requestIp } from "@/lib/security/request";
import { isValidEmail } from "@/lib/utils";

function revalidateAll() {
  revalidatePath("/", "layout");
}

function asRole(value: string): StaffRole | null {
  return (STAFF_ROLES as readonly string[]).includes(value) ? (value as StaffRole) : null;
}

function asIntent(value: string): LoginIntent | null {
  return (LOGIN_INTENTS as readonly string[]).includes(value) ? (value as LoginIntent) : null;
}

export async function magicLinkAction(
  _prev: { error?: string; sent?: boolean } | null,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const intent = asIntent(String(formData.get("intent") ?? "host")) ?? "host";
  const ip = await requestIp();
  if (!rateLimit(`magic:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS).ok) {
    logSecurityEvent("rate_limited", { subject: "magic" });
    return { sent: true };
  }
  if (!isValidEmail(email)) return { error: "email" };
  const profile = getProfileByEmail(email);
  if (profile) {
    const membership = getActiveMembership(profile.id, undefined, intent);
    if (membership) {
      const { rawToken } = createLoginLink({
        userId: profile.id,
        intendedRole: intent,
        intendedOrganizationId: membership.organizationId,
      });
      const dict = await getDictionary(profile.locale || (await getLocale()));
      const url = await requestUrl(`/access/login/${encodeURIComponent(rawToken)}`);
      await sendAccessEmail({
        to: profile.email,
        subject: dict.access.loginMailSubject,
        title: dict.access.loginMailTitle,
        body: dict.access.loginMailBody,
        cta: dict.access.loginMailCta,
        url,
        ttl: dict.access.loginMailTtl,
        dict,
      });
    }
  }
  return { sent: true };
}

export async function consumeLoginLinkAction(rawToken: string) {
  const consumed = consumeLoginLink(rawToken);
  if (!consumed) return { error: "token" as const };
  const membership =
    consumed.membership ??
    getActiveMembership(
      consumed.profile.id,
      consumed.link.intendedOrganizationId,
      consumed.link.intendedRole,
    );
  if (!membership) return { error: "token" as const };
  await setSession({
    profileId: consumed.profile.id,
    organizationId: membership.organizationId,
    membershipId: membership.id,
    role: membership.role,
  });
  redirect(roleHome(membership.role));
}

export async function acceptInviteAction(
  _prev: { error?: string } | null,
  formData: FormData,
) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (password && password.length < 8) return { error: "password" };
  const accepted = acceptInvitation(token, {
    firstName,
    lastName,
    password: password || undefined,
  });
  if (!accepted) return { error: "token" };
  await setSession({
    profileId: accepted.profile.id,
    organizationId: accepted.membership.organizationId,
    membershipId: accepted.membership.id,
    role: accepted.membership.role,
  });
  redirect(roleHome(accepted.membership.role));
}

export async function switchMembershipAction(formData: FormData) {
  const session = await requireSession();
  const membershipId = String(formData.get("membershipId") ?? "");
  const membership = switchActiveMembership(session.profileId, membershipId);
  if (!membership) redirect(roleHome(session.role));
  await setSession({
    profileId: session.profileId,
    organizationId: membership.organizationId,
    membershipId: membership.id,
    role: membership.role,
  });
  redirect(roleHome(membership.role));
}

export async function createInvitationAction(
  _prev: {
    error?: string;
    inviteUrl?: string;
    smsDelivered?: boolean;
    emailDelivered?: boolean;
    channel?: string;
  } | null,
  formData: FormData,
) {
  const session = await requireHostSession();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = asRole(String(formData.get("role") ?? ""));
  if (!role || !canInviteRole(session.role, role)) return { error: "forbidden" };
  if (!isValidEmail(email)) return { error: "email" };

  const selected = formData.getAll("propertyIds").map(String).filter(Boolean);
  const orgProperties = listProperties(session.organizationId);
  const propertyIds = selected.filter((id) =>
    orgProperties.some((property) => property.id === id),
  );
  if (role !== "host" && propertyIds.length === 0) return { error: "required" };

  const directoryId = String(formData.get("directoryId") ?? "") || undefined;
  const { invitation, rawToken } = createInvitation({
    organizationId: session.organizationId,
    email,
    phone: phone || undefined,
    role,
    propertyIds,
    invitedByUserId: session.profileId,
    directoryId,
    channel: phone ? "sms" : "email",
  });

  const dict = await getDictionary(await getLocale());
  const inviteUrl = await requestUrl(`/access/invite/${encodeURIComponent(rawToken)}`);
  const org = getOrganization(session.organizationId);
  const profile = getProfile(session.profileId);
  const emailResult = await sendAccessEmail({
    to: email,
    subject: interpolate(dict.access.inviteMailSubject, { org: org?.name ?? "Homioqo" }),
    title: dict.access.inviteMailTitle,
    body: interpolate(dict.access.inviteMailBody, {
      org: org?.name ?? "Homioqo",
      name: profile?.fullName ?? "",
      role: dict.access.roles[role],
    }),
    cta: dict.access.inviteMailCta,
    url: inviteUrl,
    ttl: dict.access.inviteMailTtl,
    dict,
  });

  let smsDelivered = false;
  if (phone) {
    const sms = await sendSms(
      phone,
      interpolate(dict.access.smsInvite, { org: org?.name ?? "Homioqo", url: inviteUrl }),
    );
    smsDelivered = sms.delivered;
  }

  revalidateAll();
  return {
    inviteUrl,
    smsDelivered,
    emailDelivered: emailResult.delivered,
    channel: invitation.channel,
  };
}

export async function revokeInvitationAction(formData: FormData) {
  const session = await requireHostSession();
  revokeInvitation(session.organizationId, String(formData.get("invitationId") ?? ""));
  revalidateAll();
}

export async function saveGuestAccessAction(
  _prev: { error?: string; saved?: boolean } | null,
  formData: FormData,
) {
  const session = await requireHostSession();
  const propertyId = String(formData.get("propertyId") ?? "");
  const pin = String(formData.get("pin") ?? "");
  const expiresAt = String(formData.get("expiresAt") ?? "").trim();
  const clearPin = String(formData.get("clearPin") ?? "") === "1";
  try {
    if (clearPin) {
      setGuestPin(session.organizationId, propertyId, null);
    } else if (pin.trim()) {
      setGuestPin(session.organizationId, propertyId, pin.trim());
    }
    setGuestLinkExpiry(
      session.organizationId,
      propertyId,
      expiresAt ? new Date(expiresAt).toISOString() : null,
    );
  } catch {
    return { error: "generic" };
  }
  revalidateAll();
  return { saved: true };
}

export async function revokeGuestLinkAction(formData: FormData) {
  const session = await requireHostSession();
  revokeGuestLink(session.organizationId, String(formData.get("propertyId") ?? ""));
  logSecurityEvent("qr_revoked");
  revalidateAll();
}

export async function unlockGuestAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const token = String(formData.get("token") ?? "");
  const pin = String(formData.get("pin") ?? "");
  const property = getPropertyByToken(token);
  if (!property) return { error: "token" };
  if (!guestPinMatches(property, pin)) return { error: "pin" };
  await setGuestUnlocked(token);
  revalidateAll();
  return null;
}

export async function loginWithIntentAction(
  _prev: { error?: string } | null,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const intent = asIntent(String(formData.get("intent") ?? "host")) ?? "host";
  const nextRaw = String(formData.get("next") ?? "");
  const ip = await requestIp();
  if (
    !rateLimit(
      `login:${ip}`,
      process.env.NODE_ENV === "production" ? LOGIN_LIMIT : LOGIN_LIMIT * 10,
      LOGIN_WINDOW_MS,
    ).ok
  ) {
    logSecurityEvent("rate_limited", { subject: "login" });
    return { error: "login" };
  }
  await hydrateAccountSnapshot();
  const profile = authenticate(email, password);
  if (!profile) {
    logSecurityEvent("login_failed");
    return { error: "login" };
  }
  if (!profile.emailVerifiedAt) return { error: "unverified" };
  const memberships = listMembershipsForUser(profile.id);
  const match =
    memberships.find((item) => item.role === intent) ??
    (intent === "host" ? memberships.find((item) => item.role === "host") : undefined);
  if (!match) return { error: "wrongRole" };
  try {
    await setSession({
      profileId: profile.id,
      organizationId: match.organizationId,
      membershipId: match.id,
      role: match.role,
    });
  } catch {
    return { error: "generic" };
  }
  const next =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//") && !nextRaw.startsWith("/\\")
      ? nextRaw
      : roleHome(match.role);
  redirect(next.startsWith(roleHome(match.role)) || match.role === "host" ? next : roleHome(match.role));
}
