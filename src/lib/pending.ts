import { cookies } from "next/headers";
import { PENDING_SIGNUP_COOKIE } from "@/lib/constants";

export async function getPendingSignupId() {
  const jar = await cookies();
  return jar.get(PENDING_SIGNUP_COOKIE)?.value ?? null;
}
