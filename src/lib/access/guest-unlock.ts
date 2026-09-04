import { cookies } from "next/headers";
import { GUEST_UNLOCK_COOKIE, GUEST_UNLOCK_MAX_AGE } from "@/lib/constants";
import { signValue, unsignValue, verifyPassword } from "@/lib/crypto";
import type { Property } from "@/lib/types";

export function guestPinRequired(property: Property) {
  return Boolean(property.guestPinHash);
}

export function guestPinMatches(property: Property, pin: string) {
  if (!property.guestPinHash) return true;
  return verifyPassword(pin.trim(), property.guestPinHash);
}

export async function isGuestUnlocked(token: string) {
  const jar = await cookies();
  const signed = jar.get(GUEST_UNLOCK_COOKIE)?.value;
  if (!signed) return false;
  const raw = unsignValue(signed);
  return raw === token;
}

export async function setGuestUnlocked(token: string) {
  const jar = await cookies();
  jar.set(GUEST_UNLOCK_COOKIE, signValue(token), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_UNLOCK_MAX_AGE,
  });
}
