"use client";

import Image from "next/image";
import type { Dictionary } from "@/i18n/messages";

const images: Record<string, string> = {
  restaurants: "/landing/area-restaurant-costa.jpg",
  clubs: "/landing/area-club-costa.jpg",
  beaches: "/landing/area-beach-costa.jpg",
  taxi: "/landing/area-taxi-transfer.jpg",
  boat: "/landing/area-boat-costa.jpg",
  golf: "/landing/area-golf-costa.jpg",
  shopping: "/landing/area-shopping-costa.jpg",
  activities: "/landing/area-activity-costa.jpg",
};

export function LocalRecommendations({ dict }: { dict: Dictionary }) {
  const m = dict.marketing.area;

  return (
    <section className="py-14 lg:py-16">
      <div className="container-marketing">
        <h2 className="max-w-xl font-display text-3xl font-semibold text-ocean sm:text-4xl">
          {m.title}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy-600">{m.subtitle}</p>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {m.cards.map((card) => (
            <li
              key={card.id}
              className="group overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="relative h-40">
                <Image
                  src={images[card.id] ?? images.beaches}
                  alt={card.alt}
                  fill
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                  className="photo-brand object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-terracotta">
                  {card.distance}
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold text-ocean">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-600">{card.description}</p>
                <a
                  href="#funktioner"
                  className="mt-4 inline-flex text-sm font-semibold text-terracotta underline-offset-4 hover:text-terracotta-hover hover:underline"
                >
                  {card.id === "taxi" || card.id === "boat" ? m.map : m.more}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
