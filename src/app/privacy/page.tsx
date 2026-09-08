import { Logo } from "@/components/brand/logo";
import { SiteHeader } from "@/components/site-header";
import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.legal.privacy, { index: true });
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (
    <div className="min-h-dvh bg-canvas">
      <SiteHeader dict={dict} locale={locale} />
      <main className="container-page max-w-2xl py-12">
        <Logo />
        <h1 className="mt-8 text-3xl font-semibold text-navy-800">{dict.legal.privacy}</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-navy-700">
          <p>
            Vi behandlar namn, e-post, telefonnummer, företagsnamn, land, språk och uppgifter om
            bostäder och ärenden för att tillhandahålla Homioqo. Rättslig grund är avtal samt, för
            produktnyheter, ditt frivilliga samtycke.
          </p>
          <p>
            Telefonnummer lagras i internationellt format. Lösenord lagras hashat. Verifieringslänkar
            lagras som hash och upphör efter 24 timmar. API-nycklar för e-post och översättning
            ligger enbart på servern.
          </p>
          <p>
            Du kan exportera dina uppgifter och radera kontot i inställningarna. Marknadsföring
            kräver separat samtycke och kan återkallas när som helst. Originaltext i meddelanden
            sparas tillsammans med översättning.
          </p>
          <p>
            Kontakt: hej@homioqo.se
          </p>
        </div>
      </main>
    </div>
  );
}
