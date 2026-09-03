import Image from "next/image";
import { LogoWordmark } from "@/components/brand/logo";
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
          <div className="relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[16/10] lg:min-h-[34rem]">
            <Image
              src="/landing/qr-setup-interior.jpg"
              alt={m.imageAlt}
              fill
              sizes="(min-width: 1024px) 80rem, 100vw"
              className="photo-brand object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ocean/35 via-transparent to-transparent" />

            <div className="absolute bottom-3 left-2 w-[min(42%,11.25rem)] sm:bottom-6 sm:left-5 sm:w-[12.5rem]">
              <div className="rounded-[1.35rem] border border-sand-200 bg-white p-3.5 shadow-lift sm:p-4">
                <LogoWordmark className="text-[1.05rem] leading-none" />
                <div className="mt-3 overflow-hidden rounded-xl bg-ivory p-2">
                  <Image
                    src="/landing/qr-homioqo.png"
                    alt={m.qrAlt}
                    width={640}
                    height={640}
                    className="h-auto w-full"
                  />
                </div>
                <p className="mt-2.5 text-center text-[11px] font-medium leading-snug text-navy-500">
                  {m.caption}
                </p>
              </div>
            </div>

            <div className="absolute bottom-3 right-2 origin-bottom-right scale-[0.72] sm:bottom-6 sm:right-5 sm:scale-90 lg:scale-100">
              <GuestGuidePhone dict={dict} label={m.phoneAlt} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
