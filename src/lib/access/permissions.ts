import type { Membership, StaffRole } from "@/lib/types";

export function membershipIsActive(membership: Membership | undefined | null): membership is Membership {
  return Boolean(membership && !membership.revokedAt);
}

export function canAccessProperty(membership: Membership, propertyId: string, organizationId: string) {
  if (!membershipIsActive(membership)) return false;
  if (membership.organizationId !== organizationId) return false;
  if (membership.role === "host") return true;
  return membership.propertyIds.includes(propertyId);
}

export function scopedPropertyIds(membership: Membership): string[] | "all" {
  if (membership.role === "host") return "all";
  return membership.propertyIds;
}

export function canInviteRole(actor: StaffRole, target: StaffRole) {
  return actor === "host" && target !== "host";
}

export function canManageOrg(membership: Membership) {
  return membershipIsActive(membership) && membership.role === "host";
}

/** Hosts order printed QR signs for homes they manage. Guests and staff cannot. */
export function canOrderQrSign(
  membership: Membership | null | undefined,
  propertyId: string,
): membership is Membership {
  if (!membershipIsActive(membership)) return false;
  if (membership.role !== "host") return false;
  return canAccessProperty(membership, propertyId, membership.organizationId);
}
