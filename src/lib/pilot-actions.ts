"use server";

import { headers } from "next/headers";
import { createPilotLead } from "@/lib/data/store";
import { type PilotResult, validatePilotLead } from "@/lib/pilot-schema";
import { rateLimit } from "@/lib/rate-limit";

const PILOT_LIMIT = 5;
const PILOT_WINDOW_MS = 60 * 60 * 1000;

async function clientIp() {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown"
  );
}

/**
 * Public form, so it is rate limited per IP and every field is validated
 * server-side regardless of what the browser sent.
 */
export async function submitPilotAction(formData: FormData): Promise<PilotResult> {
  const limit = rateLimit(`pilot:${await clientIp()}`, PILOT_LIMIT, PILOT_WINDOW_MS);
  if (!limit.ok) return { ok: false, error: "rate" };

  // Honeypot: a real person never fills a hidden field.
  if (String(formData.get("website") ?? "").trim()) return { ok: true };

  const parsed = validatePilotLead(formData);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    createPilotLead(parsed.data);
  } catch {
    return { ok: false, error: "generic" };
  }
  return { ok: true };
}
