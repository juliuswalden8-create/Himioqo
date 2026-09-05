import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { AppListRow } from "@/components/app-list-row";
import { PageHeader } from "@/components/page-header";
import { ReadyBadge } from "@/components/cleaning-status";
import { SafePhoto } from "@/components/safe-photo";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { interpolate, getDictionary, getLocale } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/page-metadata";
import {
  getCleaningJob,
  getDashboardStats,
  getOrganization,
  getProfile,
  getUsageMetrics,
  isTrialEnded,
  listCases,
  listCleaners,
  listCleaningJobs,
  listCleaningNotifications,
  listContractors,
  trialDaysLeft,
} from "@/lib/data/store";
import { formatTime } from "@/lib/format";
import { greeting } from "@/lib/format";
import { requireHostSession } from "@/lib/session";
import { bookOnboardingAction } from "@/lib/locale-actions";
import { isToday, parseISO } from "date-fns";
import type { Dictionary } from "@/i18n/messages";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.nav.overview);
}

function weekDelta(dict: Dictionary, value: number) {
  if (value === 0) return dict.dashboard.statDeltaNone;
  const delta = value > 0 ? `+${value}` : String(value);
  return interpolate(dict.dashboard.statDelta, { delta });
}

export default async function OverviewPage() {
  const session = await requireHostSession();
  const profile = getProfile(session.profileId);
  const org = getOrganization(session.organizationId);
  const stats = getDashboardStats(session.organizationId);
  const usage = getUsageMetrics(session.organizationId);
  const recent = listCases(session.organizationId).slice(0, 5);
  const cleaning = listCleaningJobs(session.organizationId).slice(0, 3);
  const notices = listCleaningNotifications(session.organizationId);
  const contractors = listContractors(session.organizationId);
  const cleaners = listCleaners(session.organizationId);
  const showTeamHint = contractors.length === 0 && cleaners.length === 0;
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const days = trialDaysLeft(session.organizationId);
  const ended = isTrialEnded(session.organizationId);
  const trialLabel =
    ended
      ? dict.dashboard.trialEnded
      : days === null
        ? null
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
  const notice = notices[0];
  const noticeJob = notice ? getCleaningJob(session.organizationId, notice.jobId) : undefined;

  const kpis = [
    {
      href: "/app/properties",
      value: stats.propertyCount,
      label: dict.dashboard.statsProperties,
      delta: stats.deltas.propertyCount,
    },
    {
      href: "/app/cases?status=new",
      value: stats.newCases,
      label: dict.dashboard.statsNew,
      delta: stats.deltas.newCases,
    },
    {
      href: "/app/cases",
      value: stats.openCases,
      label: dict.dashboard.statsOpen,
      delta: stats.deltas.openCases,
    },
    {
      href: "/app/cases?status=resolved",
      value: stats.resolvedThisMonth,
      label: dict.dashboard.statsResolved,
      delta: stats.deltas.resolvedThisMonth,
    },
    {
      href: "/app/cases?priority=urgent",
      value: stats.urgentCases,
      label: dict.dashboard.statsUrgent,
      delta: stats.deltas.urgentCases,
    },
  ];

  return (
    <div className="min-h-dvh bg-canvas">
      <AppHeader dict={dict} orgName={org?.name} current="overview" />
      <main className="container-page space-y-8 py-8">
        {trialLabel ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-navy-800">{trialLabel}</p>
              {ended ? (
                <p className="mt-1 text-sm text-muted-foreground">{dict.dashboard.trialEndedHelp}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {ended ? (
                <Button asChild size="sm" variant="secondary">
                  <Link href="/app/settings#billing">{dict.dashboard.trialEndedContact}</Link>
                </Button>
              ) : (
                <form action={bookOnboardingAction}>
                  <Button type="submit" size="sm" variant="secondary">
                    {dict.dashboard.book}
                  </Button>
                </form>
              )}
              <Button asChild size="sm" variant="cta">
                <Link href="/app/settings#billing">{dict.dashboard.choosePlan}</Link>
              </Button>
            </div>
          </div>
        ) : null}
        {showTeamHint ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-navy-800">{dict.dashboard.inviteTeam}</p>
              <p className="mt-1 text-sm text-muted-foreground">{dict.dashboard.inviteTeamHelp}</p>
            </div>
            <Button asChild size="sm">
              <Link href="/app/settings#users">{dict.dashboard.inviteTeamCta}</Link>
            </Button>
          </div>
        ) : null}
        {notice && noticeJob ? (
          <div className="flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-status-done" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-medium text-navy-800">
                {interpolate(dict.dashboard.cleaningNotice, { property: notice.propertyName })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {interpolate(dict.dashboard.cleaningNoticeTime, {
                  time: formatTime(notice.createdAt, locale),
                })}
                {" · "}
                <Link href={`/app/properties/${noticeJob.propertyId}`} className="font-medium text-navy-700 underline">
                  {dict.dashboard.openProperty}
                </Link>
              </p>
            </div>
          </div>
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
          actions={
            <Button asChild variant="cta">
              <Link href="/app/cases/new">{dict.dashboard.createCase}</Link>
            </Button>
          }
        />
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {kpis.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-2xl border border-border bg-white p-4 shadow-soft transition-colors hover:border-ocean/30"
            >
              <p className="text-2xl font-semibold text-navy-800">{item.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-xs text-muted-foreground">{weekDelta(dict, item.delta)}</p>
            </Link>
          ))}
        </section>
        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.dashboard.usage}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{dict.dashboard.usageHelp}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-canvas p-4">
              <p className="text-2xl font-semibold text-navy-800">{usage.scans}</p>
              <p className="mt-1 text-sm text-muted-foreground">{dict.dashboard.usageScans}</p>
            </div>
            <div className="rounded-2xl bg-canvas p-4">
              <p className="text-2xl font-semibold text-navy-800">{usage.reports}</p>
              <p className="mt-1 text-sm text-muted-foreground">{dict.dashboard.usageReports}</p>
            </div>
            <div className="rounded-2xl bg-canvas p-4">
              <p className="text-2xl font-semibold text-navy-800">
                {usage.avgResolutionHours == null
                  ? "—"
                  : interpolate(dict.dashboard.usageResolutionValue, {
                      hours: String(usage.avgResolutionHours),
                    })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{dict.dashboard.usageResolution}</p>
              {usage.avgResolutionHours == null ? (
                <p className="mt-1 text-xs text-muted-foreground">{dict.dashboard.usageResolutionEmpty}</p>
              ) : null}
            </div>
            <div className="rounded-2xl bg-canvas p-4">
              <p className="text-2xl font-semibold text-navy-800">{usage.cleaningsCompleted}</p>
              <p className="mt-1 text-sm text-muted-foreground">{dict.dashboard.usageCleanings}</p>
            </div>
            <div className="rounded-2xl bg-canvas p-4">
              <p className="text-2xl font-semibold text-navy-800">{usage.handledCases}</p>
              <p className="mt-1 text-sm text-muted-foreground">{dict.dashboard.usageHandled}</p>
            </div>
            <div className="rounded-2xl bg-canvas p-4">
              <p className="text-2xl font-semibold text-navy-800">{usage.wifiCopies}</p>
              <p className="mt-1 text-sm text-muted-foreground">{dict.dashboard.usageWifi}</p>
            </div>
          </div>
          <div className="mt-3 rounded-2xl bg-canvas p-4">
            <p className="text-sm font-medium text-navy-800">{dict.dashboard.usageSelfServe}</p>
            <p className="mt-1 text-sm text-navy-800">
              {interpolate(dict.dashboard.usageSelfServeValue, {
                views: String(usage.guideViews),
                wifi: String(usage.wifiCopies),
                reports: String(usage.reports),
              })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{dict.dashboard.usageSelfServeHelp}</p>
          </div>
        </section>
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-sm font-semibold text-navy-800">{dict.dashboard.recent}</h2>
            {recent.length ? (
              <ul className="mt-2">
                {recent.map((item) => (
                  <AppListRow
                    key={item.id}
                    href={`/app/cases/${item.id}`}
                    badges={<StatusBadge status={item.status} dict={dict} />}
                  >
                    <p className="truncate text-sm font-medium text-navy-800">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.reference} · {item.property.name}
                      {" · "}
                      {item.contractor?.name ?? dict.dashboard.unassigned}
                    </p>
                  </AppListRow>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{dict.dashboard.emptyCases}</p>
            )}
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
              <ul className="mt-2">
                {[...cleaning]
                  .sort(
                    (a, b) =>
                      Number(Boolean(b.property.guestReady)) - Number(Boolean(a.property.guestReady)),
                  )
                  .map((job) => {
                    const done = job.checklist.filter((item) => item.done).length;
                    const completed = job.completedAt
                      ? isToday(parseISO(job.completedAt))
                        ? interpolate(dict.cleaning.completedAt, {
                            time: `idag ${formatTime(job.completedAt)}`,
                          })
                        : interpolate(dict.cleaning.completedAt, { time: formatTime(job.completedAt) })
                      : null;
                    const jobDone = job.status === "completed" || job.status === "approved";
                    return (
                      <AppListRow
                        key={job.id}
                        href={`/app/cleaning/${job.id}`}
                        badges={
                          jobDone ? null : job.property.guestReady ? (
                            <ReadyBadge label={dict.dashboard.ready} />
                          ) : null
                        }
                      >
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
                      </AppListRow>
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
          <p className="mt-1 text-sm text-muted-foreground">{dict.dashboard.beforeAfterHelp}</p>
          {documented.length ? (
            <ul className="mt-5 grid gap-4 md:grid-cols-3">
              {documented.map(({ case: item, before, after }) => (
                <li key={item.id} className="min-w-0">
                  <Link href={`/app/cases/${item.id}`} className="block">
                    <div className="grid grid-cols-2 gap-2">
                      <SafePhoto
                        src={before.url}
                        alt={interpolate(dict.dashboard.beforeAlt, { title: item.title })}
                        fallbackLabel={dict.dashboard.photoFallback}
                        className="h-28 w-full rounded-xl object-cover"
                      />
                      <SafePhoto
                        src={after.url}
                        alt={interpolate(dict.dashboard.afterAlt, { title: item.title })}
                        fallbackLabel={dict.dashboard.photoFallback}
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
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">{dict.dashboard.noPhotos}</p>
          )}
        </section>
      </main>
    </div>
  );
}
