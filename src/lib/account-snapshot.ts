import { cookies } from "next/headers";
import { ACCOUNT_SNAPSHOT_COOKIE, SESSION_MAX_AGE } from "@/lib/constants";
import { signValue, unsignValue } from "@/lib/crypto";
import { getOrganization, upsertAccountSnapshot } from "@/lib/data/store";
import type { Organization, Profile } from "@/lib/types";

export interface AccountSnapshot {
  v: 1;
  profile: Profile;
  organization: Organization;
}

function encodeAccountSnapshot(snapshot: AccountSnapshot) {
  const encoded = Buffer.from(JSON.stringify(snapshot), "utf8").toString("base64url");
  return signValue(encoded);
}

function decodeAccountSnapshot(raw: string): AccountSnapshot | null {
  const encoded = unsignValue(raw);
  if (!encoded) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as AccountSnapshot;
    if (parsed?.v !== 1 || !parsed.profile?.id || !parsed.organization?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Replays a verified account into this serverless instance's memory. */
export async function hydrateAccountSnapshot() {
  const jar = await cookies();
  const signed = jar.get(ACCOUNT_SNAPSHOT_COOKIE)?.value;
  if (!signed) return;
  const snapshot = decodeAccountSnapshot(signed);
  if (!snapshot) return;
  upsertAccountSnapshot(snapshot);
}

export async function saveAccountSnapshot(profile: Profile) {
  const organization = getOrganization(profile.organizationId);
  if (!organization) return;
  const jar = await cookies();
  jar.set(ACCOUNT_SNAPSHOT_COOKIE, encodeAccountSnapshot({ v: 1, profile, organization }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearAccountSnapshot() {
  const jar = await cookies();
  jar.delete(ACCOUNT_SNAPSHOT_COOKIE);
}
