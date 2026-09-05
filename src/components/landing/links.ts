import type { AccountType } from "@/lib/types";

export const PRODUCT_DEMO_HREF = "/demo";
export const GUEST_GUIDE_DEMO_HREF = "/g/qr_solsidan";
export const BOOK_DEMO_HREF = "#demo";

export function startPilotHref(audience: AccountType) {
  return audience === "company" ? "/register?segment=company" : "/register?segment=private";
}
