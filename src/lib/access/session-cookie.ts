import { membershipIsActive } from "@/lib/access/permissions";
import { unsignValue } from "@/lib/crypto";
import {
  getActiveMembership,
  getMembership,
  getProfile,
} from "@/lib/data/store";
import { STAFF_ROLES, type Membership, type StaffRole } from "@/lib/types";

export interface SessionPayload {
  profileId: string;
  organizationId: string;
  role: StaffRole;
  membershipId: string;
  membership: Membership;
}

function isRole(value: string | undefined): value is StaffRole {
  return Boolean(value && (STAFF_ROLES as readonly string[]).includes(value));
}

export function encodeSessionValue(membership: Membership, sessionVersion = 0) {
  return `${membership.userId}:${membership.organizationId}:${membership.role}:${membership.id}:${sessionVersion}`;
}

/**
 * Trusts the membership row, never the role string in the cookie. A cleaner
 * who puts "host" in a cookie still gets their actual membership role, or
 * nothing if they pointed at someone else's membership id.
 */
export function sessionFromRaw(raw: string): SessionPayload | null {
  const [profileId, organizationId, cookieRole, membershipId, versionRaw] = raw.split(":");
  if (!profileId || !organizationId) return null;
  const profile = getProfile(profileId);
  if (!profile) return null;
  const cookieVersion = versionRaw === undefined || versionRaw === "" ? 0 : Number(versionRaw);
  if (!Number.isFinite(cookieVersion) || cookieVersion !== (profile.sessionVersion ?? 0)) {
    return null;
  }

  if (membershipId) {
    const membership = getMembership(membershipId);
    if (!membershipIsActive(membership)) return null;
    if (membership.userId !== profileId) return null;
    if (membership.organizationId !== organizationId) return null;
    return {
      profileId,
      organizationId: membership.organizationId,
      role: membership.role,
      membershipId: membership.id,
      membership,
    };
  }

  const membership =
    (isRole(cookieRole)
      ? getActiveMembership(profileId, organizationId, cookieRole)
      : null) ??
    getActiveMembership(profileId, organizationId, "host") ??
    getActiveMembership(profileId, organizationId);
  if (!membership) return null;
  return {
    profileId,
    organizationId: membership.organizationId,
    role: membership.role,
    membershipId: membership.id,
    membership,
  };
}

export function sessionFromSignedCookie(signed: string): SessionPayload | null {
  const raw = unsignValue(signed);
  if (!raw) return null;
  return sessionFromRaw(raw);
}

export function peekRoleFromRaw(raw: string): StaffRole | null {
  const session = sessionFromRaw(raw);
  return session?.role ?? null;
}
