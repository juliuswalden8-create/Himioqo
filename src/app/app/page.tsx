import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { ReadyBadge } from "@/components/cleaning-status";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { interpolate, getDictionary, getLocale } from "@/i18n/get-dictionary";
import {
  getDashboardStats,
  getOrganization,
  getProfile,
  listCases,
  listCleaningJobs,
  listCleaningNotifications,
  trialDaysLeft,
} from "@/lib/data/store";
import { formatTime } from "@/lib/format";
import { greeting } from "@/lib/format";
import { getSession } from "@/lib/session";
import { bookOnboardingAction } from "@/lib/locale-actions";
import { isToday, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const profile = getProfile(session.profileId);
  const org = getOrganization(session.organizationId);
  const stats = getDashboardStats(session.organizationId);
  const recent = listCases(session.organizationId).slice(0, 5);
  const cleaning = listCleaningJobs(session.organizationId).slice(0, 3);
  const notices = listCleaningNotifications(session.organizationId);
  const locale = await getLocale();
  const dict = await getDictionary(profile?.locale || locale);
  const days = trialDaysLeft(session.organizationId);
  const trialLabel =
    days === null
      ? null
      : days <= 0
        ? dict.dashboard.trialEnded
        : days === 1
          ? dict.dashboard.trialToday
          : interpolate(dict.dashboard.trial, { days: String(days) });
  const documented = listCases(session.organizationId)
    .map((item) => {
      const before =
        item.attachments.find((a) => a.kind === "before") ??
        item.attachments.find((a) => a.kind === "reported");
      const after = item.attachments.find((a) => a.kind === "after");
      if (!before || !after) return null;
      return { case: item, before, after };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 3);

  return (
    <div className="min-h-dvh bg-canvas">
      <AppHeader dict={dict} orgName={org?.name} current="overview" />
      <main className="container-page space-y-8 py-8">
        {trialLabel ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-navy-800">{trialLabel}</p>
            <form action={bookOnboardingAction}>
              <Button type="submit" size="sm" variant="secondary">
                {dict.dashboard.book}
              </Button>
            </form>
          </div>
        ) : null}
        {notices[0] ? (
          <Link
            href={`/app/cleaning/${notices[0].jobId}`}
            className="block rounded-2xl border border-green-100 bg-green-50 px-4 py-3"
          >
            <p className="text-sm font-medium text-navy-800">
              {interpolate(dict.dashboard.cleaningNotice, { property: notices[0].propertyName })}
            </p>
          </Link>
        ) : null}
        <PageHeader
          title={greeting(profile?.fullName ?? dict.dashboard.greetingFallback, {
            morning: dict.dashboard.greetingMorning,
            afternoon: dict.dashboard.greetingAfternoon,
            evening: dict.dashboard.greetingEvening,
          })}
          description={
            org?.accountType === "private"
              ? dict.dashboard.greetingHelpPrivate
              : dict.dashboard.greetingHelp
          }
        />
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            [stats.propertyCount, dict.dashboard.statsProperties],
            [stats.newCases, dict.dashboard.statsNew],
            [stats.openCases, dict.dashboard.statsOpen],
            [stats.resolvedThisMonth, dict.dashboard.statsResolved],
            [stats.urgentCases, dict.dashboard.statsUrgent],
          ].map(([value, label]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-border bg-white p-4 shadow-soft"
            >
              <p className="text-2xl font-semibold text-navy-800">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </section>
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-sm font-semibold text-navy-800">{dict.dashboard.recent}</h2>
            <ul className="mt-4 divide-y divide-border">
              {recent.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <Link href={`/app/cases/${item.id}`} className="min-w-0 hover:underline">
                    <p className="truncate text-sm font-medium text-navy-800">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.reference} · {item.property.name}
                      {item.contractor ? ` · ${item.contractor.name}` : ""}
                    </p>
                  </Link>
                  <StatusBadge status={item.status} dict={dict} />
                </li>
              ))}
            </ul>
            <Link
              href="/app/cases"
              className="mt-3 inline-block text-sm font-medium text-navy-700 hover:underline"
            >
              {dict.dashboard.allCases}
            </Link>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-sm font-semibold text-navy-800">{dict.dashboard.cleaning}</h2>
            {cleaning.length ? (
              <ul className="mt-4 space-y-3">
                {[...cleaning]
                  .sort((a, b) => Number(Boolean(b.property.guestReady)) - Number(Boolean(a.property.guestReady)))
                  .map((job) => {
                  const done = job.checklist.filter((item) => item.done).length;
                  const completed = job.completedAt
                    ? isToday(parseISO(job.completedAt))
                      ? interpolate(dict.cleaning.completedAt, {
                          time: `idag ${formatTime(job.completedAt)}`,
                        })
                      : interpolate(dict.cleaning.completedAt, { time: formatTime(job.completedAt) })
                    : null;
                  return (
                    <li key={job.id}>
                      <Link
                        href={`/app/cleaning/${job.id}`}
                        className="block rounded-xl border border-border/80 px-3 py-3 hover:border-green-100"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-navy-800">
                              {dict.dashboard.cleaning} · {job.property.name}
                            </p>
                            {completed ? (
                              <p className="mt-1 text-xs text-muted-foreground">{completed}</p>
                            ) : null}
                            <p className="text-xs text-muted-foreground">
                              {interpolate(dict.cleaning.points, {
                                done: String(done),
                                total: String(job.checklist.length),
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {interpolate(dict.cleaning.photoCount, {
                                count: String(job.photos.length),
                              })}
                            </p>
                          </div>
                          {job.property.guestReady ? (
                            <ReadyBadge label={dict.dashboard.ready} />
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{dict.cleaning.empty}</p>
            )}
            <Link
              href="/app/cleaning"
              className="mt-3 inline-block text-sm font-medium text-navy-700 hover:underline"
            >
              {dict.dashboard.allCleaning}
            </Link>
          </div>
        </section>
        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.dashboard.beforeAfter}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {dict.dashboard.beforeAfterHelp}
          </p>
          {documented.length ? (
            <ul className="mt-5 grid gap-4 md:grid-cols-3">
              {documented.map(({ case: item, before, after }) => (
                <li key={item.id} className="min-w-0">
                  <div className="grid grid-cols-2 gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={before.url}
                      alt={`Före: ${item.title}`}
                      className="h-28 w-full rounded-xl object-cover"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={after.url}
                      alt={`Efter: ${item.title}`}
                      className="h-28 w-full rounded-xl object-cover"
                    />
                    <p className="text-[11px] text-muted-foreground">{dict.dashboard.before}</p>
                    <p className="text-[11px] text-muted-foreground">{dict.dashboard.after}</p>
                  </div>
                  <p className="mt-2 truncate text-sm font-medium text-navy-800">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.property.name}
                    {item.contractor ? ` · ${item.contractor.name}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              {dict.dashboard.noPhotos}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
