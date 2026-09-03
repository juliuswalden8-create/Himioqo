import Link from "next/link";
import { redirect } from "next/navigation";
import { ProgressSteps } from "@/components/progress-steps";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
            <form action={onboardingPropertyAction} className="mt-5 space-y-3">
              <p className="text-sm text-muted-foreground">{dict.onboarding.s1Text}</p>
              <Label htmlFor="name">{dict.propertyForm.name}</Label>
              <Input id="name" name="name" required />
              <Label htmlFor="address">{dict.propertyForm.address}</Label>
              <Input id="address" name="address" required />
              <Label htmlFor="city">{dict.propertyForm.city}</Label>
              <Input id="city" name="city" required />
              <Label htmlFor="tenantName">{dict.propertyForm.tenant}</Label>
              <Input id="tenantName" name="tenantName" required />
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
            <form action={onboardingContractorAction} className="mt-5 space-y-3">
              <p className="text-sm text-muted-foreground">{dict.onboarding.s3Text}</p>
              <Label htmlFor="c-name">{dict.contractorForm.name}</Label>
              <Input id="c-name" name="name" required />
              <Label htmlFor="contactName">{dict.contractorForm.contact}</Label>
              <Input id="contactName" name="contactName" required />
              <Label htmlFor="trade">{dict.contractorForm.trade}</Label>
              <Input id="trade" name="trade" />
              <Label htmlFor="c-phone">{dict.contractorForm.phone}</Label>
              <Input id="c-phone" name="phone" />
              <Label htmlFor="c-email">{dict.contractorForm.email}</Label>
              <Input id="c-email" name="email" type="email" />
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
