import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { roleHome } from "@/lib/access/roles";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginLayout({ children }: { children: ReactNode }) {
  let session = null;
  try {
    session = await getSession();
  } catch {
    // A missing session secret or a bad cookie must not take down the login page.
  }
  if (session) redirect(roleHome(session.role));
  return children;
}
