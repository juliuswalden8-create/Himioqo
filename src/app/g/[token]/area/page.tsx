import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GuestShell } from "@/components/guest/guest-shell";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { getGuestGuide } from "@/lib/data/store";
import { pageMetadata } from "@/lib/page-metadata";
import { PLACE_CATEGORY_ICONS } from "@/lib/places";
import type { PlaceCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.guide.metaTitle);
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const guest = getGuestGuide(token);
  if (!guest) notFound();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const counts = new Map<PlaceCategory, number>();
  for (const item of guest.places) {
    counts.set(item.place.category, (counts.get(item.place.category) ?? 0) + 1);
  }
  const categories = guest.guide.categoryOrder.filter((category) => (counts.get(category) ?? 0) > 0);

  return (
    <GuestShell dict={dict} locale={locale} backHref={`/g/${token}`}>
      <h1 className="text-2xl font-semibold text-navy-800">{dict.guide.area}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{guest.property.name}</p>
      {categories.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {categories.map((category) => {
            const Icon = PLACE_CATEGORY_ICONS[category];
            return (
              <Link
                key={category}
                href={`/g/${token}/area/${category}`}
                className="flex min-h-[7.5rem] flex-col justify-between rounded-3xl border border-border bg-white p-4 shadow-soft"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy-50 text-navy-800">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold leading-snug text-navy-800">
                    {dict.guide.categories[category]}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {counts.get(category)}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">{dict.guide.emptyArea}</p>
      )}
    </GuestShell>
  );
}
