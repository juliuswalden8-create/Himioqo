import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/constants";
import { getProfile } from "@/lib/data/store";

export interface SessionPayload {
  profileId: string;
  organizationId: string;
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
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
  jar.set(SESSION_COOKIE, `${payload.profileId}:${payload.organizationId}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
