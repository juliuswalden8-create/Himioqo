import type { Metadata } from "next";
import { MarketingSite } from "@/components/landing/marketing-site";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { resolveAudience } from "@/lib/audience";
import { siteOrigin } from "@/lib/utils";

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Homioqo",
    url: siteOrigin(),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: dict.marketing.meta.description,
    inLanguage: locale,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingSite dict={dict} locale={locale} initialAudience={initialAudience} />
    </>
  );
}
