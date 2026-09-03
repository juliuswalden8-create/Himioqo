import { z } from "zod";
import { isValidEmail } from "@/lib/utils";

export const pilotSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    company: z.string().trim().max(160),
    email: z.string().trim().min(1).max(200).refine(isValidEmail),
    phone: z.string().trim().max(40),
    region: z.string().trim().max(120),
    propertyCount: z.string().trim().max(40),
    rentalType: z.enum(["shortTerm", "longTerm", "mixed"]),
    currentMethod: z.string().trim().max(500),
    mostValuable: z.string().trim().max(500),
    message: z.string().trim().max(2000),
    accountType: z.enum(["private", "company"]),
    wantsPilot: z.boolean(),
    consent: z.literal(true),
    locale: z.string().trim().max(10),
  })
  .superRefine((data, ctx) => {
    if (data.accountType === "company" && data.company.length < 1) {
      ctx.addIssue({ code: "custom", path: ["company"], message: "required" });
    }
  });

export type PilotError = "required" | "email" | "consent" | "rate" | "generic";
export type PilotResult = { ok: true } | { ok: false; error: PilotError };

/**
 * Server-side validation for the public demo / pilot form. Kept pure and free of
 * any request context so it can be exercised directly by tests.
 */
export function validatePilotLead(formData: FormData) {
  const accountRaw = String(formData.get("accountType") ?? "company");
  const candidate = {
    name: String(formData.get("name") ?? ""),
    company: String(formData.get("company") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    region: String(formData.get("region") ?? ""),
    propertyCount: String(formData.get("propertyCount") ?? ""),
    rentalType: String(formData.get("rentalType") ?? "shortTerm"),
    currentMethod: String(formData.get("currentMethod") ?? ""),
    mostValuable: String(formData.get("mostValuable") ?? ""),
    message: String(formData.get("message") ?? ""),
    accountType: accountRaw === "private" ? "private" : "company",
    wantsPilot: formData.get("wantsPilot") === "on",
    consent: formData.get("consent") === "on",
    locale: String(formData.get("locale") ?? "sv"),
  };

  const parsed = pilotSchema.safeParse(candidate);
  if (parsed.success) return { ok: true as const, data: parsed.data };

  const paths = parsed.error.issues.map((issue) => issue.path[0]);
  if (paths.includes("consent")) return { ok: false as const, error: "consent" as const };
  if (paths.includes("email")) return { ok: false as const, error: "email" as const };
  return { ok: false as const, error: "required" as const };
}
