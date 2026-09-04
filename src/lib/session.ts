import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { roleHome } from "@/lib/access/roles";
import {
  encodeSessionValue,
  sessionFromSignedCookie,
  type SessionPayload,
} from "@/lib/access/session-cookie";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/constants";
import { hydrateAccountSnapshot } from "@/lib/account-snapshot";
import { signValue } from "@/lib/crypto";
import { bumpSessionVersion, getActiveMembership, getMembership, getProfile } from "@/lib/data/store";
import type { StaffRole } from "@/lib/types";

export type { SessionPayload };

export async function getSession(): Promise<SessionPayload | null> {
  await hydrateAccountSnapshot();
  const jar = await cookies();
  const signed = jar.get(SESSION_COOKIE)?.value;
  if (!signed) return null;
  return sessionFromSignedCookie(signed);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireHostSession(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "host") redirect(roleHome(session.role));
  return session;
}

export async function requireRoleSession(role: StaffRole): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== role) redirect(roleHome(session.role));
  return session;
}

export async function setSession(payload: {
  profileId: string;
  organizationId: string;
  role?: StaffRole;
  membershipId?: string;
}) {
  const membership = payload.membershipId
    ? getMembership(payload.membershipId)
    : getActiveMembership(payload.profileId, payload.organizationId, payload.role) ??
      getActiveMembership(payload.profileId, payload.organizationId);
  if (!membership || membership.userId !== payload.profileId) {
    throw new Error("no membership");
  }
  const jar = await cookies();
  const profile = getProfile(payload.profileId);
  jar.set(SESSION_COOKIE, signValue(encodeSessionValue(membership, profile?.sessionVersion ?? 0)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession() {
  const current = await getSession();
  if (current) bumpSessionVersion(current.profileId);
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
