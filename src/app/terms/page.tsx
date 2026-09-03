import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { SiteHeader } from "@/components/site-header";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (
    <div className="min-h-dvh bg-canvas">
      <SiteHeader dict={dict} locale={locale} />
      <main className="container-page max-w-2xl py-12">
        <Logo />
        <h1 className="mt-8 text-3xl font-semibold text-navy-800">{dict.legal.terms}</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-navy-700">
          <p>
            Homioqo tillhandahålls av Homioqo för fastighetsförvaltare och uthyrningsbolag.
            Genom att skapa ett konto godkänner du att använda tjänsten för att hantera
            felanmälningar, hantverkare och kommunikation kring bostäder du förvaltar.
          </p>
          <p>
            Provperioden ger 30 dagar Homioqo Pro utan betalkort. Ingen betalprenumeration
            startas förrän du aktivt väljer ett betalt abonnemang. Du kan avsluta när som helst
            under provperioden utan kostnad.
          </p>
          <p>
            Du ansvarar för att de uppgifter du lägger in är korrekta och att du har rätt att
            behandla hyresgästers och hantverkares kontaktuppgifter. Homioqo lagrar ärenden,
            bilder och meddelanden för att du ska kunna dokumentera underhållet.
          </p>
          <p>
            Verifieringslänkar är unika, tidsbegränsade och får inte delas. Missbruk, spam eller
            automatiserade registreringar kan leda till att kontot stängs.
          </p>
        </div>
        <Link href="/privacy" className="mt-8 inline-block text-sm underline">
          {dict.legal.privacy}
        </Link>
      </main>
    </div>
  );
}
