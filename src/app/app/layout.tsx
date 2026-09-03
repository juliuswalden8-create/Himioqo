import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getProfile } from "@/lib/data/store";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const profile = getProfile(session.profileId);
  if (profile && !profile.emailVerifiedAt) redirect("/register/check-email");
  if (profile && !profile.onboardingCompletedAt) redirect("/onboarding");
  return children;
}
