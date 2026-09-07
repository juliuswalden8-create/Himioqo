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
  getHostAttention,
  getOrganization,
  getProfile,
  getUsageMetrics,
  isTrialEnded,
  listCases,
  listCleaners,
  listCleaningNotifications,
  listContractors,
  trialDaysLeft,
} from "@/lib/data/store";
import { formatTime } from "@/lib/format";
import { greeting } from "@/lib/format";
import { requireHostSession } from "@/lib/session";
import { bookOnboardingAction } from "@/lib/locale-actions";
import { isToday, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.nav.overview);
}

export default async function OverviewPage() {
  const session = await requireHostSession();
  const profile = getProfile(session.profileId);
  const org = getOrganization(session.organizationId);
  const attention = getHostAttention(session.organizationId);
  const usage = getUsageMetrics(session.organizationId);
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

  const urgentIds = new Set(attention.urgent.map((item) => item.id));
  const unassignedOnly = attention.unassigned.filter((item) => !urgentIds.has(item.id));
  const overdueCaseOnly = attention.overdueCases.filter(
    (item) => !urgentIds.has(item.id) && Boolean(item.contractorId),
  );
  const hasAttention =
    attention.urgent.length +
      unassignedOnly.length +
      overdueCaseOnly.length +
      attention.overdueJobs.length +
      attention.notReady.length >
    0;

  const kpis = [
    {
      href: "/app/properties",
      value: attention.needsAction.length,
      label: dict.dashboard.statsNeedsAction,
    },
    {
      href: "/app/cases?priority=urgent",
      value: attention.urgent.length,
      label: dict.dashboard.statsUrgent,
    },
    {
      href: "/app/cases",
      value: attention.unassigned.length,
      label: dict.dashboard.statsUnassigned,
    },
    {
      href: "/app/cleaning",
      value: attention.todayJobs.length,
      label: dict.dashboard.statsCleaningsToday,
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
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-2xl border border-border bg-white p-4 shadow-soft transition-colors hover:border-ocean/30"
            >
              <p className="text-2xl font-semibold text-navy-800">{item.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
            </Link>
          ))}
        </section>
        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.dashboard.attention}</h2>
          {hasAttention ? (
            <div className="mt-4 space-y-5">
              {attention.urgent.length ? (
                <AttentionGroup title={dict.dashboard.attentionUrgent}>
                  {attention.urgent.map((item) => (
                    <AttentionRow
                      key={item.id}
                      href={`/app/cases/${item.id}${item.contractorId ? "" : "#assign"}`}
                      title={item.title}
                      meta={`${item.reference} · ${item.property.name}`}
                      action={item.contractorId ? dict.dashboard.openCase : dict.dashboard.assign}
                      warning={!item.contractorId}
                      warningLabel={dict.dashboard.unassigned}
                    />
                  ))}
                </AttentionGroup>
              ) : null}
              {unassignedOnly.length ? (
                <AttentionGroup title={dict.dashboard.attentionUnassigned}>
                  {unassignedOnly.map((item) => (
                    <AttentionRow
                      key={item.id}
                      href={`/app/cases/${item.id}#assign`}
                      title={item.title}
                      meta={`${item.reference} · ${item.property.name}`}
                      action={dict.dashboard.assign}
                      warning
                      warningLabel={dict.dashboard.unassigned}
                    />
                  ))}
                </AttentionGroup>
              ) : null}
              {overdueCaseOnly.length || attention.overdueJobs.length ? (
                <AttentionGroup title={dict.dashboard.attentionOverdue}>
                  {overdueCaseOnly.map((item) => (
                    <AttentionRow
                      key={item.id}
                      href={`/app/cases/${item.id}`}
                      title={item.title}
                      meta={`${item.reference} · ${item.property.name}`}
                      action={dict.dashboard.openCase}
                    />
                  ))}
                  {attention.overdueJobs.map((job) => (
                    <AttentionRow
                      key={job.id}
                      href={`/app/cleaning/${job.id}`}
                      title={`${dict.dashboard.cleaning} · ${job.property.name}`}
                      meta={job.cleaner?.name ?? dict.cleaning.unassigned}
                      action={dict.cleaning.openChecklist}
                    />
                  ))}
                </AttentionGroup>
              ) : null}
              {attention.notReady.length ? (
                <AttentionGroup title={dict.dashboard.attentionNotReady}>
                  {attention.notReady.map((property) => (
                    <AttentionRow
                      key={property.id}
                      href={`/app/properties/${property.id}`}
                      title={property.name}
                      meta={dict.dashboard.notReady}
                      action={dict.dashboard.openProperty}
                    />
                  ))}
                </AttentionGroup>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">{dict.dashboard.attentionEmpty}</p>
          )}
        </section>
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-sm font-semibold text-navy-800">{dict.dashboard.recent}</h2>
            {attention.recent.length ? (
              <ul className="mt-2">
                {attention.recent.map((item) => (
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
            <h2 className="text-sm font-semibold text-navy-800">{dict.dashboard.todayCleaning}</h2>
            {attention.todayJobs.length ? (
              <ul className="mt-2">
                {attention.todayJobs.map((job) => {
                  const done = job.checklist.filter((item) => item.done).length;
                  const completed = job.completedAt
                    ? isToday(parseISO(job.completedAt))
                      ? interpolate(dict.cleaning.completedAt, {
                          time: `${dict.cleaning.today.toLowerCase()} ${formatTime(job.completedAt)}`,
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
          <h2 className="text-sm font-semibold text-navy-800">{dict.dashboard.usage}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{dict.dashboard.usageHelp}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <UsageStat value={usage.scans} label={dict.dashboard.usageScans} />
            <UsageStat value={usage.reports} label={dict.dashboard.usageReports} />
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
            <UsageStat value={usage.cleaningsCompleted} label={dict.dashboard.usageCleanings} />
            <UsageStat value={usage.handledCases} label={dict.dashboard.usageHandled} />
            <UsageStat value={usage.wifiCopies} label={dict.dashboard.usageWifi} />
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

function UsageStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-canvas p-4">
      <p className="text-2xl font-semibold text-navy-800">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function AttentionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <ul className="mt-2 divide-y divide-border">{children}</ul>
    </div>
  );
}

function AttentionRow({
  href,
  title,
  meta,
  action,
  warning,
  warningLabel,
}: {
  href: string;
  title: string;
  meta: string;
  action: string;
  warning?: boolean;
  warningLabel?: string;
}) {
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-navy-800">{title}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
        {warning && warningLabel ? (
          <p className="mt-1 text-xs font-medium text-status-urgent">{warningLabel}</p>
        ) : null}
      </div>
      <Button asChild size="sm" variant={warning ? "cta" : "secondary"}>
        <Link href={href}>{action}</Link>
      </Button>
    </li>
  );
}
