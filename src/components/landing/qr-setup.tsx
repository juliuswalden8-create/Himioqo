import Image from "next/image";
import { GuestGuidePhone } from "@/components/landing/guest-guide-phone";
import type { Dictionary } from "@/i18n/messages";

export function QrSetup({ dict }: { dict: Dictionary }) {
  const m = dict.marketing.qrSetup;

  return (
    <section className="bg-sage/40 py-20 lg:py-24">
      <div className="container-marketing">
        <h2 className="max-w-xl font-display text-3xl font-semibold text-ocean sm:text-4xl">
          {m.title}
        </h2>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-navy-500">{m.text}</p>

        <div className="relative mt-10 overflow-hidden rounded-[1.75rem] bg-ivory">
          <div className="relative aspect-[4/3] sm:aspect-[5/4] lg:aspect-[16/10] lg:min-h-[34rem]">
            <Image
              src="/landing/qr-setup-interior.jpg"
              alt={m.imageAlt}
              fill
              sizes="(min-width: 1024px) 80rem, 100vw"
              className="photo-brand object-cover object-[28%_center] lg:object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ocean/35 via-transparent to-transparent" />

            <div className="absolute bottom-3 right-2 origin-bottom-right scale-[0.72] sm:bottom-6 sm:right-5 sm:scale-90 lg:scale-100">
              <GuestGuidePhone dict={dict} label={m.phoneAlt} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
