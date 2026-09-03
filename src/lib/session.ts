import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/constants";
import { hydrateAccountSnapshot } from "@/lib/account-snapshot";
import { signValue, unsignValue } from "@/lib/crypto";
import { getProfile } from "@/lib/data/store";

export interface SessionPayload {
  profileId: string;
  organizationId: string;
}

export async function getSession(): Promise<SessionPayload | null> {
  await hydrateAccountSnapshot();
  const jar = await cookies();
  const signed = jar.get(SESSION_COOKIE)?.value;
  if (!signed) return null;
  // The cookie is attacker-controlled, so the signature must verify before the
  // ids inside it are trusted to identify a profile or an organisation.
  const raw = unsignValue(signed);
  if (!raw) return null;
  const [profileId, organizationId] = raw.split(":");
  if (!profileId || !organizationId) return null;
  const profile = getProfile(profileId);
  if (!profile || profile.organizationId !== organizationId) return null;
  return { profileId, organizationId };
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function setSession(payload: SessionPayload) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signValue(`${payload.profileId}:${payload.organizationId}`), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
