"use client";

import { AudienceProvider, useAudience } from "@/components/landing/audience";
import { BusinessDashboard } from "@/components/landing/business-dashboard";
import { DemoSection } from "@/components/landing/demo-form";
import { DigitalGuestGuide } from "@/components/landing/digital-guest-guide";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { FounderNote } from "@/components/landing/founder-note";
import { GetStarted } from "@/components/landing/get-started";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LocalRecommendations } from "@/components/landing/local-recommendations";
import { MarketingFooter } from "@/components/landing/marketing-footer";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { Pricing } from "@/components/landing/pricing";
import { PrivateBenefits } from "@/components/landing/private-benefits";
import { QrSetup } from "@/components/landing/qr-setup";
import { Team } from "@/components/landing/team";
import { TrustPoints } from "@/components/landing/trust-points";
import type { Dictionary } from "@/i18n/messages";
import type { AccountType } from "@/lib/types";

export function MarketingSite({
  dict,
  locale,
  initialAudience,
}: {
  dict: Dictionary;
  locale: string;
  initialAudience: AccountType;
}) {
  return (
    <AudienceProvider initial={initialAudience}>
      <MarketingFrame dict={dict} locale={locale} />
    </AudienceProvider>
  );
}

function MarketingFrame({ dict, locale }: { dict: Dictionary; locale: string }) {
  const { audience } = useAudience();

  return (
    <div className="marketing-page min-h-dvh bg-canvas" data-audience={audience}>
      <MarketingHeader dict={dict} locale={locale} />
      <main>
        <Hero dict={dict} />
        <HowItWorks dict={dict} />
        <QrSetup dict={dict} />
        <DigitalGuestGuide dict={dict} />
        <LocalRecommendations dict={dict} />
        <PrivateBenefits dict={dict} />
        <BusinessDashboard dict={dict} />
        <GetStarted dict={dict} />
        <TrustPoints dict={dict} />
        <FounderNote dict={dict} />
        <Team dict={dict} />
        <Pricing dict={dict} />
        <Faq dict={dict} />
        <FinalCta dict={dict} />
        <DemoSection locale={locale} dict={dict} />
      </main>
      <MarketingFooter dict={dict} locale={locale} />
    </div>
  );
}
