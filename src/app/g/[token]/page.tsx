import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  Compass,
  Home,
  Mail,
  Phone,
} from "lucide-react";
import { EmergencyButton } from "@/components/guest/emergency-button";
import { GuestShell } from "@/components/guest/guest-shell";
import { ScanBeacon } from "@/components/guest/scan-beacon";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { getGuestGuide } from "@/lib/data/store";
import { pickText } from "@/lib/places";

export const dynamic = "force-dynamic";

export default async function GuestGuidePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const guest = getGuestGuide(token);
  if (!guest) notFound();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const welcome = pickText(guest.guide.welcome, locale);
  const emergency = pickText(guest.guide.emergency, locale);
  const managerPhone = guest.org?.supportPhone || guest.org?.emergencyPhone;
  const managerEmail = guest.org?.supportEmail;

  const actions = [
    {
      href: `/g/${token}/info`,
      title: dict.guide.stay,
      hint: dict.guide.stayHint,
      icon: Home,
    },
    {
      href: `/g/${token}/area`,
      title: dict.guide.area,
      hint: dict.guide.areaHint,
      icon: Compass,
    },
    {
      href: `/g/${token}/report`,
      title: dict.guide.report,
      hint: dict.guide.reportHint,
      icon: AlertCircle,
    },
  ];

  return (
    <GuestShell dict={dict} locale={locale}>
      <ScanBeacon token={token} />
      <p className="text-sm text-muted-foreground">{dict.guide.noApp}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-800">
        {guest.property.name}
      </h1>
      {welcome ? (
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{welcome}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {managerPhone ? (
          <a
            href={`tel:${managerPhone.replace(/\s/g, "")}`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-3 text-sm text-navy-800"
          >
            <Phone className="h-4 w-4" />
            {managerPhone}
          </a>
        ) : null}
        {managerEmail ? (
          <a
            href={`mailto:${managerEmail}`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-3 text-sm text-navy-800"
          >
            <Mail className="h-4 w-4" />
            {dict.guide.email}
          </a>
        ) : null}
        <EmergencyButton
          dict={dict}
          managerPhone={guest.org?.emergencyPhone || managerPhone}
          emergencyText={emergency}
        />
      </div>

      <div className="mt-8 grid gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex min-h-[5.5rem] items-center gap-4 rounded-3xl border border-border bg-white px-5 py-4 shadow-soft"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy-800">
              <action.icon className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-lg font-semibold text-navy-800">{action.title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{action.hint}</span>
            </span>
          </Link>
        ))}
      </div>
    </GuestShell>
  );
}
