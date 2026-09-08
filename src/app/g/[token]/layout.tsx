import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GuestPinForm } from "@/components/guest/pin-form";
import { NotFoundState } from "@/components/not-found-state";
import { isGuestUnlocked } from "@/lib/access/guest-unlock";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { getPropertyByToken } from "@/lib/data/store";
import { isPublicProductDemo } from "@/lib/public-demo";
import { NOINDEX_ROBOTS } from "@/lib/security/robots";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return {
    title: dict.guide.metaTitle,
    description: dict.guide.noApp,
    robots: NOINDEX_ROBOTS,
    openGraph: {
      title: dict.guide.metaTitle,
      description: dict.guide.noApp,
    },
    twitter: {
      card: "summary",
      title: dict.guide.metaTitle,
      description: dict.guide.noApp,
    },
  };
}

export default async function GuestTokenLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  if (isPublicProductDemo(token)) return children;
  const property = getPropertyByToken(token);
  if (!property) return <NotFoundState dict={dict} locale={locale} />;
  if (property.guestPinHash && !(await isGuestUnlocked(token))) {
    return <GuestPinForm dict={dict} token={token} propertyName={property.name} />;
  }
  return children;
}
