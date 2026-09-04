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

  const origin = siteOrigin();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: "Homioqo",
        url: origin,
        logo: {
          "@type": "ImageObject",
          url: `${origin}/brand/icon-192.png`,
          width: 192,
          height: 192,
        },
        email: "hej@homioqo.se",
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: "Homioqo",
        url: origin,
        description: dict.marketing.meta.description,
        inLanguage: locale,
        publisher: { "@id": `${origin}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        name: "Homioqo",
        url: origin,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: dict.marketing.meta.description,
        inLanguage: locale,
        publisher: { "@id": `${origin}/#organization` },
      },
    ],
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
