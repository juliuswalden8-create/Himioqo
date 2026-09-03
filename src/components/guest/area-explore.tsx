"use client";

import { useMemo, useState } from "react";
import { Clock, MapPin, Tag } from "lucide-react";
import { TrackedLink } from "@/components/guest/tracked-link";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/messages";
import {
  formatKm,
  haversineKm,
  isSponsored,
  mapsDirectionsUrl,
  osmEmbedUrl,
  pickText,
} from "@/lib/places";
import type { Place, Property } from "@/lib/types";
import { cn, whatsappUrl } from "@/lib/utils";

export function AreaExplore({
  places,
  property,
  token,
  locale,
  dict,
}: {
  places: Place[];
  property: Pick<Property, "lat" | "lng">;
  token: string;
  locale: string;
  dict: Dictionary;
}) {
  const [mode, setMode] = useState<"list" | "map">("list");
  const [selectedId, setSelectedId] = useState(places[0]?.id);
  const selected = places.find((item) => item.id === selectedId) ?? places[0];

  const origin =
    property.lat != null && property.lng != null
      ? { lat: property.lat, lng: property.lng }
      : undefined;

  const mapSrc = useMemo(() => {
    if (!selected?.lat || !selected.lng) return null;
    return osmEmbedUrl(selected.lat, selected.lng);
  }, [selected]);

  if (!places.length) {
    return <p className="text-sm text-muted-foreground">{dict.guide.emptyCategory}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(["list", "map"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={cn(
              "h-11 rounded-xl border text-sm font-semibold",
              mode === item
                ? "border-navy-800 bg-navy-800 text-white"
                : "border-border bg-white text-navy-800",
            )}
          >
            {item === "list" ? dict.guide.list : dict.guide.map}
          </button>
        ))}
      </div>

      {mode === "map" && mapSrc ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
          <iframe
            title={selected?.name}
            src={mapSrc}
            className="h-56 w-full"
            loading="lazy"
          />
          <div className="flex gap-2 overflow-x-auto p-2">
            {places.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => setSelectedId(place.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                  selectedId === place.id ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-800",
                )}
              >
                {place.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <ul className="space-y-3">
        {(mode === "map" && selected ? [selected] : places).map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            origin={origin}
            token={token}
            locale={locale}
            dict={dict}
          />
        ))}
      </ul>
    </div>
  );
}

function PlaceCard({
  place,
  origin,
  token,
  locale,
  dict,
}: {
  place: Place;
  origin?: { lat: number; lng: number };
  token: string;
  locale: string;
  dict: Dictionary;
}) {
  const description = pickText(place.description, locale);
  const discount = pickText(place.discountLabel, locale);
  const sponsored = isSponsored(place.sponsored, place.monetization.kind);
  const km =
    origin && place.lat != null && place.lng != null
      ? haversineKm(origin, { lat: place.lat, lng: place.lng })
      : null;
  const directions =
    place.lat != null && place.lng != null
      ? mapsDirectionsUrl({ lat: place.lat, lng: place.lng, address: place.address }, origin)
      : place.address
        ? mapsDirectionsUrl({ lat: 0, lng: 0, address: place.address }, origin)
        : null;
  const bookHref = place.bookingUrl || place.monetization.affiliateUrl;
  const website = place.website;

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
      {place.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={place.imageUrl} alt="" className="h-40 w-full object-cover" />
      ) : null}
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-navy-800">{place.name}</h2>
            {km != null ? (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {dict.guide.distance.replace("{km}", formatKm(km, locale))}
              </p>
            ) : null}
          </div>
          {sponsored ? (
            <span className="shrink-0 rounded-full border border-navy-200 bg-navy-50 px-2 py-0.5 text-[11px] font-medium text-navy-700">
              {dict.guide.sponsored}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
        {place.hours ? (
          <p className="flex items-center gap-1.5 text-sm text-navy-800">
            <Clock className="h-4 w-4 text-navy-500" />
            {place.hours}
          </p>
        ) : null}
        {discount || place.discountCode ? (
          <div className="rounded-2xl bg-green-50 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-sm font-medium text-navy-800">
              <Tag className="h-4 w-4 text-green-700" />
              {discount || dict.guide.discount}
            </p>
            {place.discountCode ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {dict.guide.code}: {place.discountCode}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          {place.phone ? (
            <Button asChild variant="secondary" className="h-11">
              <TrackedLink
                href={`tel:${place.phone.replace(/\s/g, "")}`}
                token={token}
                placeId={place.id}
                kind="click_phone"
              >
                {dict.guide.call}
              </TrackedLink>
            </Button>
          ) : null}
          {place.whatsapp ? (
            <Button asChild className="h-11">
              <TrackedLink
                href={whatsappUrl(place.whatsapp, place.name)}
                token={token}
                placeId={place.id}
                kind="click_whatsapp"
              >
                {dict.guide.whatsapp}
              </TrackedLink>
            </Button>
          ) : null}
          {directions ? (
            <Button asChild variant="secondary" className="h-11">
              <TrackedLink href={directions} token={token} placeId={place.id} kind="click_maps">
                {dict.guide.directions}
              </TrackedLink>
            </Button>
          ) : null}
          {website ? (
            <Button asChild variant="secondary" className="h-11">
              <TrackedLink href={website} token={token} placeId={place.id} kind="click_website">
                {dict.guide.website}
              </TrackedLink>
            </Button>
          ) : null}
          {bookHref ? (
            <Button asChild className="col-span-2 h-11">
              <TrackedLink href={bookHref} token={token} placeId={place.id} kind="click_book">
                {dict.guide.book}
              </TrackedLink>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
