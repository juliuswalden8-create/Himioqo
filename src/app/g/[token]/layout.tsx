import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { GuestPinForm } from "@/components/guest/pin-form";
import { isGuestUnlocked } from "@/lib/access/guest-unlock";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { getPropertyByToken } from "@/lib/data/store";

export default async function GuestTokenLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const property = getPropertyByToken(token);
  if (!property) notFound();
  if (property.guestPinHash && !(await isGuestUnlocked(token))) {
    const locale = await getLocale();
    const dict = await getDictionary(locale);
    return <GuestPinForm dict={dict} token={token} propertyName={property.name} />;
  }
  return children;
}
