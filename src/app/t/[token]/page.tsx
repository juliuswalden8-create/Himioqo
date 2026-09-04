import { Logo } from "@/components/brand/logo";
import { StatusBadge } from "@/components/status-badge";
import { interpolate, getDictionary, getLocale } from "@/i18n/get-dictionary";
import { getCaseByTrackToken } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export default async function TrackThanksPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const item = getCaseByTrackToken(token);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4">
      <div className="max-w-md rounded-3xl border border-border bg-white p-8 text-center shadow-soft">
        <Logo />
        <h1 className="mt-6 text-xl font-semibold text-navy-800">{dict.report.thanksTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{dict.report.thanksBody}</p>
        {item?.reference ? (
          <p className="mt-4 rounded-2xl bg-navy-50 px-4 py-3 text-sm font-medium text-navy-800">
            {interpolate(dict.report.thanksRef, { ref: item.reference })}
          </p>
        ) : null}
        {item ? (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-muted-foreground">{dict.report.trackHelp}</p>
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {dict.report.trackStatus}
              </p>
              <StatusBadge status={item.status} dict={dict} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
