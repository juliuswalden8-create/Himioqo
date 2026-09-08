import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AreaExplore } from "@/components/guest/area-explore";
import { GuestShell } from "@/components/guest/guest-shell";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { getGuestGuide } from "@/lib/data/store";
import { pageMetadata } from "@/lib/page-metadata";
import { PLACE_CATEGORIES, type PlaceCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.guide.metaTitle);
}

export default async function AreaCategoryPage({
  params,
}: {
  params: Promise<{ token: string; category: string }>;
}) {
  const { token, category } = await params;
  if (!PLACE_CATEGORIES.includes(category as PlaceCategory)) notFound();
  const guest = getGuestGuide(token);
  if (!guest) notFound();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const places = guest.places
    .filter((item) => item.place.category === category)
    .map((item) => item.place);

  return (
    <GuestShell dict={dict} locale={locale} backHref={`/g/${token}/area`}>
      <h1 className="mb-5 text-2xl font-semibold text-navy-800">
        {dict.guide.categories[category as PlaceCategory]}
      </h1>
      <AreaExplore
        places={places}
        property={guest.property}
        token={token}
        locale={locale}
        dict={dict}
      />
    </GuestShell>
  );
}
