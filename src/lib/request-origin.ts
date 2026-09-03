import { headers } from "next/headers";
import { appUrl } from "@/lib/utils";

export async function getRequestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return appUrl("").replace(/\/$/, "") || "http://localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function requestUrl(path: string) {
  const origin = await getRequestOrigin();
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
