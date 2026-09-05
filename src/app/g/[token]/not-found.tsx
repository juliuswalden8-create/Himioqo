import type { Metadata } from "next";
import { NotFoundState } from "@/components/not-found-state";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.errors.notFoundTitle);
}

export default async function GuestNotFound() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return <NotFoundState dict={dict} locale={locale} />;
}
