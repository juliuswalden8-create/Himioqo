import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProgressSteps } from "@/components/progress-steps";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { FormField, NativeSelect } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { propertyTypeLabel } from "@/lib/labels";
import { pickText } from "@/lib/places";
import { qrDataUrl } from "@/lib/qr";
import { roleHome } from "@/lib/access/roles";
import { getSession } from "@/lib/session";
import {
  getProfile,
  getPropertyGuide,
  listProperties,
} from "@/lib/data/store";
import {
  finishOnboardingAction,
  onboardingGuideAction,
  onboardingPropertyAction,
} from "@/lib/signup-actions";
import { requestUrl } from "@/lib/request-origin";
import { PROPERTY_TYPES } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(await getLocale());
  return {
    title: dict.onboarding.title,
    robots: { index: false, follow: false },
  };
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "host") redirect(roleHome(session.role));
  const profile = getProfile(session.profileId);
  if (!profile) redirect("/login");
  if (profile.onboardingCompletedAt) redirect("/app");

  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const { step: stepRaw } = await searchParams;
  const properties = listProperties(session.organizationId);
  const first = properties[0];
  const requested = Number(stepRaw ?? "1");
  let step = Number.isFinite(requested) ? Math.min(4, Math.max(1, requested)) : 1;
  if (!first && step > 1) step = 1;
  const guide = first ? getPropertyGuide(first.id) : undefined;
  const qr = first ? await qrDataUrl(await requestUrl(`/g/${first.reportToken}`), 280) : null;
  const rulesPrefill = guide ? pickText(guide.houseRules, profile.locale || locale) : "";

  const titles = [dict.onboarding.s1, dict.onboarding.s2, dict.onboarding.s3, dict.onboarding.s4];

  return (
    <div className="min-h-dvh bg-canvas">
      <SiteHeader dict={dict} locale={profile.locale || locale} />
      <main className="container-page max-w-lg py-10">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8">
          <ProgressSteps current={step - 1} steps={titles} />
          <h1 className="mt-6 text-2xl font-semibold text-navy-800">{dict.onboarding.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{dict.onboarding.subtitle}</p>
          <p className="mt-4 text-sm font-medium text-navy-800">
            {step}/4 · {titles[step - 1]}
          </p>

          {step === 1 ? (
            <form action={onboardingPropertyAction} className="mt-5 space-y-5">
              <p className="text-sm text-muted-foreground">{dict.onboarding.s1Text}</p>
              <FormField label={dict.propertyForm.name} htmlFor="name" required>
                <Input id="name" name="name" required defaultValue={first?.name} />
              </FormField>
              <FormField label={dict.propertyForm.address} htmlFor="address" required>
                <Input id="address" name="address" required defaultValue={first?.address} />
              </FormField>
              <FormField label={dict.propertyForm.city} htmlFor="city" required>
                <Input id="city" name="city" required defaultValue={first?.city} />
              </FormField>
              <FormField label={dict.propertyForm.type} htmlFor="type">
                <NativeSelect id="type" name="type" defaultValue={first?.type ?? "apartment"}>
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {propertyTypeLabel(dict, type)}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField
                label={dict.propertyForm.tenant}
                htmlFor="tenantName"
                hint={dict.propertyForm.tenantHelp}
              >
                <Input
                  id="tenantName"
                  name="tenantName"
                  defaultValue={first?.tenantName}
                  placeholder={dict.propertyForm.tenantDefault}
                />
              </FormField>
              <FormField
                label={dict.propertyForm.notes}
                htmlFor="notes"
                hint={dict.propertyForm.notesHelp}
              >
                <Textarea id="notes" name="notes" defaultValue={first?.notes ?? ""} />
              </FormField>
              <Button type="submit" className="w-full">
                {dict.onboarding.addProperty}
              </Button>
            </form>
          ) : null}

          {step === 2 && first ? (
            <form action={onboardingGuideAction} className="mt-5 space-y-5">
              <p className="text-sm text-muted-foreground">{dict.onboarding.s2Text}</p>
              <FormField label={dict.homes.wifiName} htmlFor="wifiName">
                <Input id="wifiName" name="wifiName" defaultValue={guide?.wifiName} />
              </FormField>
              <FormField label={dict.homes.wifiPassword} htmlFor="wifiPassword">
                <Input id="wifiPassword" name="wifiPassword" defaultValue={guide?.wifiPassword} />
              </FormField>
              <FormField label={dict.homes.checkIn} htmlFor="checkIn">
                <Input id="checkIn" name="checkIn" defaultValue={guide?.checkIn || "16:00"} />
              </FormField>
              <FormField label={dict.homes.checkOut} htmlFor="checkOut">
                <Input id="checkOut" name="checkOut" defaultValue={guide?.checkOut || "11:00"} />
              </FormField>
              <FormField label={dict.homes.rules} htmlFor="houseRules">
                <Textarea id="houseRules" name="houseRules" defaultValue={rulesPrefill} />
              </FormField>
              <Button type="submit" className="w-full">
                {dict.onboarding.saveGuide}
              </Button>
            </form>
          ) : null}

          {step === 3 ? (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-muted-foreground">{dict.onboarding.s3Text}</p>
              {first && qr ? (
                <>
                  <p className="text-sm font-medium">{first.name}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt={dict.qrPrint.alt} className="mx-auto h-40 w-40" />
                  <Button asChild variant="secondary" className="w-full">
                    <Link href={`/qr/${first.reportToken}`}>{dict.onboarding.downloadQr}</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/onboarding?step=4">{dict.onboarding.next}</Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{dict.onboarding.s1}</p>
              )}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-muted-foreground">{dict.onboarding.s4Text}</p>
              {first ? (
                <Button asChild className="w-full">
                  <a href={`/g/${first.reportToken}`} target="_blank" rel="noreferrer">
                    {dict.onboarding.openGuide}
                  </a>
                </Button>
              ) : null}
              <form action={finishOnboardingAction}>
                <Button type="submit" variant="secondary" className="w-full">
                  {dict.onboarding.done}
                </Button>
              </form>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
