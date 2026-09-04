import { headers } from "next/headers";

const HONEYPOT_FIELDS = ["company_website", "website", "fax"] as const;

export function clientKey(prefix: string, extra = "") {
  return `${prefix}:${extra}`;
}

export async function requestIp() {
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = hdrs.get("x-real-ip")?.trim();
  return forwarded || real || "local";
}

export function honeypotFilled(formData: FormData) {
  return HONEYPOT_FIELDS.some((name) => String(formData.get(name) ?? "").trim().length > 0);
}

/** Server actions should only run from this origin. Next already checks; this is defense in depth. */
export async function assertSameOrigin() {
  if (process.env.NODE_ENV === "test") return true;
  const hdrs = await headers();
  const origin = hdrs.get("origin");
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
