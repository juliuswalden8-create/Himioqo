"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "@/lib/constants";
import { normalizeLocale } from "@/lib/i18n/languages";
import { getSession, requireSession } from "@/lib/session";
import { bookOnboarding, updateProfile } from "@/lib/data/store";

export async function setLocaleAction(locale: string) {
  const code = normalizeLocale(locale);
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, code, {
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  const session = await getSession();
  if (session) {
    try {
      updateProfile(session.profileId, { locale: code });
    } catch {
      /* guest locale cookie is enough */
    }
  }
  revalidatePath("/", "layout");
}

export async function bookOnboardingAction() {
  const session = await requireSession();
  bookOnboarding(session.organizationId);
  revalidatePath("/", "layout");
}
