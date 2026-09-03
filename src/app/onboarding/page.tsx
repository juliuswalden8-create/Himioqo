import Link from "next/link";
import { redirect } from "next/navigation";
import { ProgressSteps } from "@/components/progress-steps";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { qrDataUrl } from "@/lib/qr";
import { getSession } from "@/lib/session";
import {
  getOrganization,
  getProfile,
  listContractors,
  listProperties,
} from "@/lib/data/store";
import {
  bookOnboardingAction,
  finishOnboardingAction,
  onboardingContractorAction,
  onboardingPropertyAction,
} from "@/lib/signup-actions";
import { requestUrl } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const profile = getProfile(session.profileId);
  if (!profile) redirect("/login");
  if (profile.onboardingCompletedAt) redirect("/app");

  const locale = await getLocale();
  const dict = await getDictionary(profile.locale || locale);
  const { step: stepRaw } = await searchParams;
  const properties = listProperties(session.organizationId);
  const contractors = listContractors(session.organizationId);
  const first = properties[0];
  const requested = Number(stepRaw ?? "1");
  const step = Number.isFinite(requested) ? Math.min(5, Math.max(1, requested)) : 1;
  const org = getOrganization(session.organizationId);
  const qr = first ? await qrDataUrl(await requestUrl(`/g/${first.reportToken}`), 280) : null;

  const titles = [dict.onboarding.s1, dict.onboarding.s2, dict.onboarding.s3, dict.onboarding.s4, dict.onboarding.s5];

  return (
    <div className="min-h-dvh bg-canvas">
      <SiteHeader dict={dict} locale={profile.locale || locale} />
      <main className="container-page max-w-lg py-10">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8">
          <ProgressSteps
            current={2}
            steps={[dict.register.step1, dict.register.step2, dict.register.step3]}
          />
          <h1 className="mt-6 text-2xl font-semibold text-navy-800">{dict.onboarding.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{dict.onboarding.subtitle}</p>
          <p className="mt-4 text-sm font-medium text-navy-800">
            {step}/5 · {titles[step - 1]}
          </p>

          {step === 1 ? (
            <form action={onboardingPropertyAction} className="mt-5 space-y-5">
              <p className="text-sm text-muted-foreground">{dict.onboarding.s1Text}</p>
              <FormField label={dict.propertyForm.name} htmlFor="name" required>
                <Input id="name" name="name" required />
              </FormField>
              <FormField label={dict.propertyForm.address} htmlFor="address" required>
                <Input id="address" name="address" required />
              </FormField>
              <FormField label={dict.propertyForm.city} htmlFor="city" required>
                <Input id="city" name="city" required />
              </FormField>
              <FormField label={dict.propertyForm.tenant} htmlFor="tenantName" required>
                <Input id="tenantName" name="tenantName" required />
              </FormField>
              <Button type="submit" className="w-full">{dict.onboarding.addProperty}</Button>
            </form>
          ) : null}

          {step === 2 ? (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-muted-foreground">{dict.onboarding.s2Text}</p>
              {first && qr ? (
                <>
                  <p className="text-sm font-medium">{first.name}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt="QR" className="mx-auto h-40 w-40" />
                  <Button asChild variant="secondary" className="w-full">
                    <Link href={`/qr/${first.reportToken}`}>{dict.onboarding.downloadQr}</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/onboarding?step=3">{dict.onboarding.skip}</Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{dict.onboarding.s1}</p>
              )}
              <Button asChild variant="secondary" className="w-full">
                <Link href="/onboarding?step=3">{dict.onboarding.skip}</Link>
              </Button>
            </div>
          ) : null}

          {step === 3 ? (
            <form action={onboardingContractorAction} className="mt-5 space-y-5">
              <p className="text-sm text-muted-foreground">{dict.onboarding.s3Text}</p>
              <FormField label={dict.contractorForm.name} htmlFor="c-name" required>
                <Input id="c-name" name="name" required />
              </FormField>
              <FormField label={dict.contractorForm.contact} htmlFor="contactName" required>
                <Input id="contactName" name="contactName" required />
              </FormField>
              <FormField label={dict.contractorForm.trade} htmlFor="trade">
                <Input id="trade" name="trade" />
              </FormField>
              <FormField label={dict.contractorForm.phone} htmlFor="c-phone">
                <Input id="c-phone" name="phone" />
              </FormField>
              <FormField label={dict.contractorForm.email} htmlFor="c-email">
                <Input id="c-email" name="email" type="email" />
              </FormField>
              <Button type="submit" className="w-full">{dict.onboarding.addContractor}</Button>
              {contractors.length ? (
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/onboarding?step=4">{dict.onboarding.skip}</Link>
                </Button>
              ) : null}
            </form>
          ) : null}

          {step === 4 ? (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-muted-foreground">{dict.onboarding.s4Text}</p>
              {first ? (
                <Button asChild className="w-full">
                  <a href={`/g/${first.reportToken}`} target="_blank" rel="noreferrer">
                    {dict.onboarding.openReport}
                  </a>
                </Button>
              ) : null}
              <Button asChild variant="secondary" className="w-full">
                <Link href="/onboarding?step=5">{dict.onboarding.skip}</Link>
              </Button>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-muted-foreground">{dict.onboarding.s5Text}</p>
              {org?.onboardingBookedAt ? (
                <p className="text-sm text-green-700">{dict.onboarding.booked}</p>
              ) : (
                <form action={bookOnboardingAction}>
                  <Button type="submit" className="w-full">{dict.onboarding.book}</Button>
                </form>
              )}
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
