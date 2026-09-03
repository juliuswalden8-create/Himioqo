import { notFound } from "next/navigation";
import { GuestShell } from "@/components/guest/guest-shell";
import { TenantReportForm } from "@/components/tenant-report-form";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { getGuestGuide } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export default async function GuestReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const guest = getGuestGuide(token);
  if (!guest) notFound();
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <GuestShell dict={dict} locale={locale} backHref={`/g/${token}`}>
      <h1 className="text-2xl font-semibold text-navy-800">{dict.report.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{dict.report.subtitle}</p>
      <div className="mt-5 rounded-3xl border border-border bg-white p-5 shadow-soft">
        <TenantReportForm
          token={token}
          propertyName={guest.property.name}
          dict={dict}
          locale={locale}
        />
      </div>
    </GuestShell>
  );
}
