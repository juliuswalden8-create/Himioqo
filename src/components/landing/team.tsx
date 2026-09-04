import Image from "next/image";
import Link from "next/link";
import { interpolate } from "@/i18n/interpolate";
import type { Dictionary } from "@/i18n/messages";
import { Button } from "@/components/ui/button";

const people = [
  {
    id: "founder" as const,
    src: "/team/founder.webp",
    objectPosition: "center",
  },
  {
    id: "coFounder" as const,
    src: "/team/co-founder.webp",
    objectPosition: "center",
  },
];

export function Team({ dict }: { dict: Dictionary }) {
  const m = dict.marketing.team;

  return (
    <section className="bg-ivory py-20 lg:py-24" aria-labelledby="team-heading">
      <div className="container-marketing">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="team-heading" className="font-display text-3xl font-semibold text-ocean sm:text-4xl">
            {m.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-navy-600">{m.intro}</p>
        </div>

        <ul className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
          {people.map((person) => {
            const card = m.people[person.id];
            return (
              <li
                key={person.id}
                className="min-w-0 overflow-hidden rounded-[1.75rem] border border-sand-200 bg-white shadow-soft"
              >
                <div className="relative aspect-square bg-ocean">
                  <Image
                    src={person.src}
                    alt={interpolate(card.alt, { name: card.name })}
                    width={960}
                    height={960}
                    sizes="(min-width: 640px) 23rem, calc(100vw - 2rem)"
                    quality={88}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: person.objectPosition }}
                  />
                </div>
                <div className="px-6 pb-6 pt-5">
                  <div className="h-px w-10 bg-terracotta" aria-hidden />
                  <h3 className="mt-4 font-display text-xl font-semibold text-ocean">{card.name}</h3>
                  <p className="mt-1 text-sm font-medium text-terracotta">{card.role}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mx-auto mt-12 max-w-xl text-center">
          <p className="text-sm leading-relaxed text-navy-600">{m.closing}</p>
          <div className="mt-6">
            <Button size="lg" variant="cta" asChild>
              <Link href="#demo">{m.cta}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
