import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  Clock,
  Info,
  ParkingCircle,
  Phone,
  Recycle,
  ShieldAlert,
  User,
  Wifi,
  Wrench,
} from "lucide-react";
import { CopyButton } from "@/components/guest/copy-button";
import { GuestShell } from "@/components/guest/guest-shell";
import type { Dictionary } from "@/i18n/messages";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { getGuestGuide } from "@/lib/data/store";
import { pageMetadata } from "@/lib/page-metadata";
import { pickText } from "@/lib/places";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.guide.metaTitle);
}

export default async function StayInfoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const guest = getGuestGuide(token);
  if (!guest) notFound();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const { guide, org, property } = guest;

  return (
    <GuestShell dict={dict} locale={locale} backHref={`/g/${token}`}>
      <h1 className="text-2xl font-semibold text-navy-800">{dict.guide.stay}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{property.name}</p>
      <div className="mt-6 space-y-3">
        {guide.wifiName ? (
          <Section icon={Wifi} title={dict.guide.wifi}>
            <Row label={dict.guide.wifiName} value={guide.wifiName} copy dict={dict} token={token} />
            {guide.wifiPassword ? (
              <Row
                label={dict.guide.wifiPassword}
                value={guide.wifiPassword}
                copy
                dict={dict}
                token={token}
              />
            ) : null}
          </Section>
        ) : (
          <Section icon={Wifi} title={dict.guide.wifi}>
            <p className="text-sm leading-relaxed text-muted-foreground">{dict.guide.wifiMissing}</p>
          </Section>
        )}
        {(guide.checkIn || guide.checkOut) ? (
          <Section icon={Clock} title={`${dict.guide.checkIn} · ${dict.guide.checkOut}`}>
            {guide.checkIn ? <Row label={dict.guide.checkIn} value={guide.checkIn} /> : null}
            {guide.checkOut ? <Row label={dict.guide.checkOut} value={guide.checkOut} /> : null}
          </Section>
        ) : null}
        <TextSection icon={Info} title={dict.guide.rules} text={pickText(guide.houseRules, locale)} />
        <TextSection icon={ParkingCircle} title={dict.guide.parking} text={pickText(guide.parking, locale)} />
        <TextSection icon={Recycle} title={dict.guide.waste} text={pickText(guide.waste, locale)} />
        {guide.appliances.length ? (
          <Section icon={Wrench} title={dict.guide.appliances}>
            <div className="space-y-3">
              {guide.appliances.map((item) => {
                const title =
                  pickText(item.title, locale) ||
                  dict.guide.appliance[item.key as keyof typeof dict.guide.appliance] ||
                  item.key;
                const text = pickText(item.text, locale);
                if (!text) return null;
                return (
                  <div key={item.id}>
                    <p className="text-sm font-medium text-navy-800">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                );
              })}
            </div>
          </Section>
        ) : null}
        <Section icon={User} title={dict.guide.manager}>
          {org?.name ? <p className="text-sm font-medium text-navy-800">{org.name}</p> : null}
          {org?.supportPhone ? (
            <a href={`tel:${org.supportPhone.replace(/\s/g, "")}`} className="mt-2 flex items-center gap-2 text-sm text-navy-800">
              <Phone className="h-4 w-4" />
              {org.supportPhone}
            </a>
          ) : null}
          {org?.supportEmail ? (
            <a href={`mailto:${org.supportEmail}`} className="mt-2 block text-sm text-navy-800">
              {org.supportEmail}
            </a>
          ) : null}
        </Section>
        {guide.importantNumbers.length ? (
          <Section icon={Phone} title={dict.guide.numbers}>
            <ul className="space-y-2">
              {guide.importantNumbers.map((item) => (
                <li key={item.id}>
                  <a href={`tel:${item.phone.replace(/\s/g, "")}`} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{pickText(item.label, locale)}</span>
                    <span className="font-medium text-navy-800">{item.phone}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
        <TextSection
          icon={ShieldAlert}
          title={dict.guide.emergencyInfo}
          text={pickText(guide.emergency, locale)}
        />
      </div>
    </GuestShell>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Wifi;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-white p-5 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-5 w-5 text-navy-700" />
        <h2 className="font-semibold text-navy-800">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function TextSection({
  icon,
  title,
  text,
}: {
  icon: typeof Wifi;
  title: string;
  text: string;
}) {
  if (!text) return null;
  return (
    <Section icon={icon} title={title}>
      <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
    </Section>
  );
}

function Row({
  label,
  value,
  copy,
  dict,
  token,
}: {
  label: string;
  value: string;
  copy?: boolean;
  dict?: Dictionary;
  token?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-navy-800">{value}</p>
      </div>
      {copy && dict ? (
        <CopyButton value={value} dict={dict} token={token} trackKind={token ? "click_wifi" : undefined} />
      ) : null}
    </div>
  );
}
