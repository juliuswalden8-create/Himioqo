import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GuestPinForm } from "@/components/guest/pin-form";
import { NotFoundState } from "@/components/not-found-state";
import { isGuestUnlocked } from "@/lib/access/guest-unlock";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { getPropertyByToken } from "@/lib/data/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const property = getPropertyByToken(token);
  return { title: property?.name ?? dict.errors.notFoundTitle };
}

export default async function GuestTokenLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const property = getPropertyByToken(token);
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  if (!property) return <NotFoundState dict={dict} locale={locale} />;
  if (property.guestPinHash && !(await isGuestUnlocked(token))) {
    return <GuestPinForm dict={dict} token={token} propertyName={property.name} />;
  }
  return children;
}
