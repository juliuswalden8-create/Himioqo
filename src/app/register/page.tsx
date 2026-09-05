import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { RegisterForm } from "@/components/register-form";
import { SiteHeader } from "@/components/site-header";
import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/page-metadata";
import { allCountries } from "@/lib/i18n/languages";
import { roleHome } from "@/lib/access/roles";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.register.title);
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ segment?: string }>;
}) {
  if (await getSession()) {
    const session = await getSession();
    if (session) redirect(roleHome(session.role));
  }
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const { segment } = await searchParams;
  const defaultAccountType = segment === "private" ? "private" : "company";
  return (
    <div className="min-h-dvh bg-canvas">
      <SiteHeader dict={dict} locale={locale} />
      <main className="container-page max-w-xl py-10">
        <div className="mb-6 flex justify-center sm:hidden">
          <Logo />
        </div>
        <div className="rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8">
          <h1 className="text-2xl font-semibold text-navy-800">{dict.register.title}</h1>
          <div className="mt-2">
            <RegisterForm
              dict={dict}
              locale={locale}
              countries={allCountries()}
              defaultAccountType={defaultAccountType}
            />
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {dict.register.hasAccount}{" "}
            <Link href="/login" className="font-medium text-navy-800 hover:underline">
              {dict.nav.login}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
