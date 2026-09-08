import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { getPublicQrSign } from "@/lib/data/store";
import { qrDataUrl } from "@/lib/qr";
import { requestUrl } from "@/lib/request-origin";
import { NOINDEX_ROBOTS } from "@/lib/security/robots";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(await getLocale());
  return {
    title: dict.qrPrint.metaTitle,
    robots: NOINDEX_ROBOTS,
  };
}

export default async function QrSignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const sign = getPublicQrSign(token);
  if (!sign) notFound();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const url = await requestUrl(`/g/${sign.reportToken}`);
  const qr = await qrDataUrl(url, 520);

  return (
    <div className="flex min-h-dvh flex-col items-center bg-canvas px-6 py-10 print:bg-white">
      <Logo />
      <div className="mt-8 w-full max-w-sm rounded-3xl border border-border bg-white px-6 py-8 text-center shadow-soft print:shadow-none">
        <p className="text-xl font-semibold leading-snug text-navy-800">{dict.qrPrint.headline}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{dict.qrPrint.prompt}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{dict.qrPrint.features}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt={dict.qrPrint.alt} className="mx-auto mt-6 h-56 w-56" />
        <p className="mt-5 text-lg font-semibold text-navy-800">{sign.name}</p>
        <p className="text-sm text-muted-foreground">
          {sign.address}, {sign.city}
        </p>
        <p className="mt-6 text-sm font-medium text-navy-800">{dict.qrPrint.scan}</p>
      </div>
    </div>
  );
}
