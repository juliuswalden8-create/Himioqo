import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { getPropertyByToken } from "@/lib/data/store";
import { qrDataUrl } from "@/lib/qr";
import { requestUrl } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

export default async function QrSignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const property = getPropertyByToken(token);
  if (!property) notFound();
  const url = await requestUrl(`/g/${property.reportToken}`);
  const qr = await qrDataUrl(url, 520);

  return (
    <div className="flex min-h-dvh flex-col items-center bg-white px-6 py-10">
      <Logo />
      <div className="mt-8 max-w-sm text-center">
        <p className="text-xl font-semibold leading-snug text-navy-800">
          Everything you need during your stay
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Wi-Fi • House information • Local recommendations • Support
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR code" className="mx-auto mt-6 h-56 w-56" />
        <p className="mt-5 font-medium text-navy-800">{property.name}</p>
        <p className="text-sm text-muted-foreground">
          {property.address}, {property.city}
        </p>
        <p className="mt-6 text-sm text-navy-800">Scan the QR code – no app required</p>
      </div>
    </div>
  );
}
