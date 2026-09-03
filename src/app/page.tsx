import type { Metadata } from "next";
import { MarketingSite } from "@/components/landing/marketing-site";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { resolveAudience } from "@/lib/audience";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const m = dict.marketing.meta;
  return {
    title: m.title,
    description: m.description,
    openGraph: {
      title: m.ogTitle,
      description: m.ogDescription,
      locale,
      type: "website",
      images: [{ url: "/landing/hero-scan.jpg", alt: dict.marketing.hero.imageAlt }],
    },
  };
}

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ segment?: string }>;
}) {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const initialAudience = resolveAudience((await searchParams).segment);

  return <MarketingSite dict={dict} locale={locale} initialAudience={initialAudience} />;
}
