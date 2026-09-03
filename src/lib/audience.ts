import type { AccountType } from "@/lib/types";

/** Marketing site defaults to private hosts. `?segment=company` selects companies. */
export function resolveAudience(value?: string): AccountType {
  return value === "company" ? "company" : "private";
}
