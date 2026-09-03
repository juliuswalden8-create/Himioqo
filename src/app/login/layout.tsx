import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginLayout({ children }: { children: ReactNode }) {
  try {
    const session = await getSession();
    if (session) redirect("/app");
  } catch {
    // A missing session secret or a bad cookie must not take down the login page.
  }
  return children;
}
