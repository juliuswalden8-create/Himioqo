import { Check } from "lucide-react";
import { CheckEmailActions } from "@/components/check-email-actions";
import { ProgressSteps } from "@/components/progress-steps";
import { SiteHeader } from "@/components/site-header";
import { interpolate, getDictionary, getLocale } from "@/i18n/get-dictionary";
import { maskEmail } from "@/lib/crypto";
import { getProfile } from "@/lib/data/store";
import { getPendingSignupId } from "@/lib/pending";
import { peekDevVerifyToken } from "@/lib/data/store";
import { requestUrl } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const { sent } = await searchParams;
  const showFull = sent === "1";
  const profileId = await getPendingSignupId();
  const profile = profileId ? getProfile(profileId) : null;
  const body =
    showFull && profile
      ? interpolate(dict.check.body, { email: profile.email })
      : dict.check.masked;
  const verifyToken =
    profile && !process.env.RESEND_API_KEY ? peekDevVerifyToken(profile.id) : null;
  const verifyUrl = verifyToken ? await requestUrl(`/verify/${verifyToken}`) : null;

  return (
    <div className="min-h-dvh bg-canvas">
      <SiteHeader dict={dict} locale={locale} />
      <main className="container-page max-w-lg py-10">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8">
          <ProgressSteps
            current={1}
            steps={[dict.register.step1, dict.register.step2, dict.register.step3]}
          />
          <h1 className="mt-6 text-2xl font-semibold text-navy-800">{dict.check.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          {showFull && profile ? (
            <p className="mt-3 break-all text-sm font-medium text-navy-800">{profile.email}</p>
          ) : profile ? (
            <p className="mt-3 text-sm font-medium text-navy-800">{maskEmail(profile.email)}</p>
          ) : null}
          <p className="mt-4 text-sm text-muted-foreground">{dict.check.spam}</p>

          <div className="mt-6 rounded-2xl bg-green-50 p-4">
            <p className="text-sm font-medium text-navy-800">{dict.check.perkTitle}</p>
            <ul className="mt-2 space-y-1">
              {dict.register.offerItems.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-navy-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <CheckEmailActions dict={dict} />
          </div>

          {verifyUrl ? (
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              {dict.check.dev}{" "}
              <a href={verifyUrl} className="font-medium text-navy-800 underline">
                {dict.email.confirm}
              </a>
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
