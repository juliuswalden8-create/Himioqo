import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { SiteHeader } from "@/components/site-header";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { peekPasswordResetToken } from "@/lib/data/store";
import { pageMetadata } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.forgot.title);
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: rawToken } = await params;
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  let token = rawToken;
  try {
    token = decodeURIComponent(rawToken);
  } catch {
    token = rawToken;
  }
  const profile = peekPasswordResetToken(token);

  return (
    <div className="min-h-dvh bg-canvas">
      <SiteHeader dict={dict} locale={locale} />
      <main className="container-page max-w-lg py-10">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8">
          {profile ? (
            <>
              <h1 className="text-2xl font-semibold text-navy-800">{dict.forgot.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{dict.verify.body}</p>
              <ResetPasswordForm dict={dict} token={token} />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-navy-800">{dict.errors.token}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{dict.check.resend}</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
