import Image from "next/image";
import Link from "next/link";
import { GuestGuidePhone } from "@/components/landing/guest-guide-phone";
import { PRODUCT_DEMO_HREF } from "@/components/landing/links";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/messages";

export function QrSetup({ dict }: { dict: Dictionary }) {
  const m = dict.marketing.qrSetup;

  return (
    <section className="bg-sage/40 py-14 lg:py-16">
      <div className="container-marketing">
        <h2 className="max-w-xl font-display text-3xl font-semibold text-ocean sm:text-4xl">
          {m.title}
        </h2>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-navy-500">{m.text}</p>

        <div className="relative mt-10 overflow-hidden rounded-[1.75rem] bg-ivory">
          <div className="relative aspect-[4/3] sm:aspect-[5/4] lg:aspect-[16/10] lg:min-h-[34rem]">
            <Image
              src="/landing/qr-setup-hall.jpg"
              alt={m.imageAlt}
              fill
              sizes="(min-width: 1024px) 80rem, 100vw"
              className="photo-brand object-cover object-[22%_center] lg:object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ocean/35 via-transparent to-transparent" />

            <div className="absolute left-[5%] top-[28%] w-[4.6rem] sm:left-[6.5%] sm:top-[30%] sm:w-[5.6rem] lg:left-[7%] lg:w-[6.4rem]">
              <div className="rounded-[3px] bg-[#f4efe6] px-1.5 py-1.5 shadow-[0_10px_24px_rgba(22,56,63,0.22)] ring-1 ring-ocean/20">
                <p className="text-center font-display text-[8px] font-semibold lowercase tracking-[-0.04em] text-ocean sm:text-[9px]">
                  homioqo
                </p>
                <Image
                  src="/landing/qr-homioqo.png"
                  alt={m.qrAlt}
                  width={96}
                  height={96}
                  className="mt-1 h-auto w-full"
                />
                <p className="mt-1 text-center text-[5.5px] leading-tight text-ocean/80 sm:text-[6.5px]">
                  {m.caption}
                </p>
              </div>
            </div>

            <div className="absolute bottom-3 right-2 origin-bottom-right scale-[0.72] sm:bottom-6 sm:right-5 sm:scale-90 lg:scale-100">
              <GuestGuidePhone dict={dict} label={m.phoneAlt} />
            </div>
          </div>
        </div>
        <div className="mt-8">
          <Button size="lg" variant="outline" asChild>
            <Link href={PRODUCT_DEMO_HREF}>{dict.marketing.cta.demo}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
