import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (session) redirect("/app");
  return children;
}
