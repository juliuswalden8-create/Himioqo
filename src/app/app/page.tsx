import Link from "next/link";
import { AlertTriangle, Home, Sparkles, UserMinus } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { AppListRow } from "@/components/app-list-row";
import { AttentionList, type AttentionRowItem } from "@/components/attention-list";
import { ReadyBadge } from "@/components/cleaning-status";
import { OpsKpiCard } from "@/components/ops-kpi-card";
import { PageHeader } from "@/components/page-header";
import { ProgressRing } from "@/components/progress-ring";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { interpolate, getDictionary, getLocale } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/page-metadata";
import {
  getHostAttention,
  getOrganization,
  getProfile,
  getResultMetrics,
  getUsageMetrics,
  isTrialEnded,
  listProperties,
  listRecentOpsActivity,
  trialDaysLeft,
} from "@/lib/data/store";
import { formatOpenDuration, formatRelative, formatTime, greeting } from "@/lib/format";
import { ratioTone } from "@/lib/ops-metrics";
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
  const properties = listProperties(session.organizationId);
  const attention = getHostAttention(session.organizationId);
  const usage = getUsageMetrics(session.organizationId);
  const results = getResultMetrics(session.organizationId);
  const activity = listRecentOpsActivity(session.organizationId);
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
  const emptyPortfolio = properties.length === 0;
  const attentionItems = buildAttentionItems(attention, dict, locale);

  const kpis = [
    {
      href: "/app/properties",
      value: attention.needsAction.length,
      label: dict.dashboard.statsNeedsAction,
      help: dict.dashboard.kpiNeedsActionHelp,
      icon: Home,
      tone: attention.needsAction.length ? ("watch" as const) : ("good" as const),
    },
    {
      href: "/app/cases?priority=urgent",
      value: attention.urgent.length,
      label: dict.dashboard.statsUrgent,
      help: dict.dashboard.kpiUrgentHelp,
      icon: AlertTriangle,
      tone: attention.urgent.length ? ("alert" as const) : ("good" as const),
    },
    {
      href: "/app/cases",
      value: attention.unassigned.length,
      label: dict.dashboard.statsUnassigned,
      help: dict.dashboard.kpiUnassignedHelp,
      icon: UserMinus,
      tone: attention.unassigned.length ? ("watch" as const) : ("neutral" as const),
    },
    {
      href: "/app/cleaning",
      value: attention.todayJobs.length,
      label: dict.dashboard.statsCleaningsToday,
      help: dict.dashboard.kpiTodayHelp,
      icon: Sparkles,
      tone: "neutral" as const,
    },
  ];

  return (
    <div className="min-h-dvh bg-canvas">
      <AppHeader dict={dict} orgName={org?.name} current="overview" />
      <main className="container-page max-w-6xl space-y-6 py-6">
        {trialLabel ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-navy-800">{trialLabel}</p>
              {ended ? (
                <p className="mt-1 text-sm text-navy-600">{dict.dashboard.trialEndedHelp}</p>
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

        <PageHeader
          title={dict.dashboard.overviewTitle}
          description={`${greeting(profile?.firstName || profile?.fullName || dict.dashboard.greetingFallback, {
            morning: dict.dashboard.greetingMorning,
            afternoon: dict.dashboard.greetingAfternoon,
            evening: dict.dashboard.greetingEvening,
          })} ${org?.accountType === "private" ? dict.dashboard.greetingHelpPrivate : dict.dashboard.greetingHelp}`}
          actions={
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <Button asChild variant="cta" className="min-h-11">
                <Link href="/app/cases/new">{dict.dashboard.createCase}</Link>
              </Button>
              <p className="text-xs text-navy-600">{dict.dashboard.updatedNow}</p>
            </div>
          }
        />

        {emptyPortfolio ? (
          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-navy-800">{dict.dashboard.welcomeTitle}</h2>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-navy-700">
              <li>{dict.dashboard.welcomeStep1}</li>
              <li>{dict.dashboard.welcomeStep2}</li>
              <li>{dict.dashboard.welcomeStep3}</li>
            </ol>
            <Button asChild className="mt-4 min-h-11" variant="cta">
              <Link href="/app/properties">{dict.dashboard.welcomeCta}</Link>
            </Button>
          </section>
        ) : null}

        <section>
          <h2 className="text-sm font-semibold text-navy-800">{dict.dashboard.opsNow}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => (
              <OpsKpiCard key={item.label} {...item} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-navy-800">{dict.dashboard.attention}</h2>
          <div className="mt-3">
            <AttentionList
              items={attentionItems}
              dict={dict}
              emptyTitle={dict.dashboard.attentionEmptyTitle}
              emptyHelp={dict.dashboard.attentionEmptyHelp}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.dashboard.results30}</h2>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <ProgressRing
              href="/app/properties"
              percent={results.homesReady.percent}
              label={dict.dashboard.ringHomes}
              countLabel={interpolate(dict.dashboard.ringHomesCount, {
                ready: String(results.homesReady.completed),
                total: String(results.homesReady.total),
              })}
              emptyLabel={emptyPortfolio ? dict.dashboard.ringNoHomes : dict.dashboard.ringNoData}
              tone={emptyPortfolio ? "empty" : ratioTone(results.homesReady.percent)}
            />
            <ProgressRing
              href="/app/cleaning"
              percent={results.cleanings.percent}
              label={dict.dashboard.ringCleanings}
              countLabel={interpolate(dict.dashboard.ringCleaningsCount, {
                done: String(results.cleanings.completed),
                total: String(results.cleanings.total),
              })}
              emptyLabel={emptyPortfolio ? dict.dashboard.ringNoHomes : dict.dashboard.ringNoData}
              tone={ratioTone(results.cleanings.percent)}
            />
            <ProgressRing
              href="/app/cases"
              percent={results.cases.percent}
              label={dict.dashboard.ringCases}
              countLabel={interpolate(dict.dashboard.ringCasesCount, {
                done: String(results.cases.completed),
                total: String(results.cases.total),
              })}
              emptyLabel={emptyPortfolio ? dict.dashboard.ringNoHomes : dict.dashboard.ringNoData}
              tone={ratioTone(results.cases.percent)}
            />
          </div>
          {emptyPortfolio ? (
            <p className="mt-2 text-center text-sm text-navy-600">{dict.dashboard.ringNoHomesHelp}</p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.dashboard.guestUsage}</h2>
          <p className="mt-1 text-sm text-navy-600">{dict.dashboard.period30}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <UsageStat
              value={usage.scans}
              label={dict.dashboard.usageGuideOpens}
              delta={usage.deltas.scans}
              dict={dict}
            />
            <UsageStat
              value={usage.wifiCopies}
              label={dict.dashboard.usageWifiCopies}
              delta={usage.deltas.wifiCopies}
              dict={dict}
            />
            <UsageStat
              value={usage.contactClicks}
              label={dict.dashboard.usageContacts}
              delta={usage.deltas.contactClicks}
              dict={dict}
            />
            <UsageStat
              value={usage.reports}
              label={dict.dashboard.usageReports}
              delta={usage.deltas.reports}
              dict={dict}
            />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-sm font-semibold text-navy-800">{dict.dashboard.recentCases}</h2>
            {attention.recent.length ? (
              <ul className="mt-2">
                {attention.recent.map((item) => (
                  <AppListRow
                    key={item.id}
                    href={`/app/cases/${item.id}`}
                    badges={
                      <>
                        <PriorityBadge priority={item.priority} dict={dict} />
                        <StatusBadge status={item.status} dict={dict} />
                      </>
                    }
                  >
                    <p className="truncate text-sm font-medium text-navy-800">{item.title}</p>
                    <p className="text-xs text-navy-600">
                      {item.property.name}
                      {" · "}
                      {item.contractor?.name ?? dict.dashboard.unassigned}
                      {" · "}
                      {formatRelative(item.updatedAt, locale)}
                    </p>
                  </AppListRow>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-navy-600">{dict.dashboard.emptyCases}</p>
            )}
            <Link href="/app/cases" className="mt-3 inline-block min-h-11 text-sm font-medium text-navy-700 underline">
              {dict.dashboard.viewAll}
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
                        ) : (
                          <span className="text-xs text-navy-600">{dict.dashboard.notReady}</span>
                        )
                      }
                    >
                      <p className="truncate text-sm font-medium text-navy-800">{job.property.name}</p>
                      <p className="text-xs text-navy-600">
                        {formatTime(job.scheduledAt, locale)}
                        {" · "}
                        {job.cleaner?.name ?? dict.cleaning.unassigned}
                      </p>
                      {completed ? <p className="text-xs text-navy-600">{completed}</p> : null}
                      <p className="text-xs text-navy-600">
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
              <p className="mt-3 text-sm text-navy-600">{dict.cleaning.empty}</p>
            )}
            <Link href="/app/cleaning" className="mt-3 inline-block min-h-11 text-sm font-medium text-navy-700 underline">
              {dict.dashboard.viewAll}
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.dashboard.activityFeed}</h2>
          {activity.length ? (
            <ul className="mt-3 space-y-3">
              {activity.map((item) => (
                <li key={item.id}>
                  <p className="text-sm text-navy-800">
                    {item.actorName ? `${item.actorName} · ` : ""}
                    {item.text}
                  </p>
                  <p className="text-xs text-navy-600">
                    {item.propertyName}
                    {item.propertyName ? " · " : ""}
                    {formatRelative(item.at, locale)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-navy-600">{dict.dashboard.activityEmpty}</p>
          )}
        </section>
      </main>
    </div>
  );
}

function UsageStat({
  value,
  label,
  delta,
  dict,
}: {
  value: number;
  label: string;
  delta: number | null;
  dict: Awaited<ReturnType<typeof getDictionary>>;
}) {
  const deltaLabel =
    delta === null
      ? null
      : delta > 0
        ? interpolate(dict.dashboard.deltaUp, { value: String(delta) })
        : delta < 0
          ? interpolate(dict.dashboard.deltaDown, { value: String(Math.abs(delta)) })
          : dict.dashboard.deltaFlat;
  return (
    <div className="rounded-2xl bg-canvas p-4">
      <p className="text-2xl font-semibold tabular-nums text-navy-800">{value}</p>
      <p className="mt-1 text-sm text-navy-600">{label}</p>
      <p className="mt-1 text-xs text-navy-600">{dict.dashboard.period30}</p>
      {deltaLabel ? <p className="mt-1 text-xs font-medium text-navy-700">{deltaLabel}</p> : null}
    </div>
  );
}

function buildAttentionItems(
  attention: ReturnType<typeof getHostAttention>,
  dict: Awaited<ReturnType<typeof getDictionary>>,
  locale: string,
): AttentionRowItem[] {
  const seen = new Set<string>();
  const items: AttentionRowItem[] = [];

  function push(item: AttentionRowItem) {
    if (seen.has(item.id) || items.length >= 5) return;
    seen.add(item.id);
    items.push(item);
  }

  for (const item of attention.urgent) {
    push({
      id: item.id,
      href: `/app/cases/${item.id}${item.contractorId ? "" : "#assign"}`,
      property: item.property.name,
      title: item.title,
      waiting: interpolate(dict.dashboard.openFor, {
        duration: formatOpenDuration(item.createdAt, locale),
      }),
      assignee: item.contractor?.name ?? null,
      action: item.contractorId ? "openCase" : "assign",
      priority: item.priority,
      status: item.status,
    });
  }
  for (const job of attention.overdueJobs) {
    push({
      id: job.id,
      href: `/app/cleaning/${job.id}`,
      property: job.property.name,
      title: `${dict.dashboard.cleaning} · ${job.property.name}`,
      waiting: formatRelative(job.scheduledAt, locale),
      assignee: job.cleaner?.name ?? null,
      action: "openCleaning",
    });
  }
  for (const property of attention.notReady) {
    push({
      id: property.id,
      href: `/app/properties/${property.id}`,
      property: property.name,
      title: property.name,
      waiting: dict.dashboard.notReady,
      assignee: null,
      action: "openProperty",
    });
  }
  for (const item of attention.unassigned) {
    push({
      id: item.id,
      href: `/app/cases/${item.id}#assign`,
      property: item.property.name,
      title: item.title,
      waiting: interpolate(dict.dashboard.openFor, {
        duration: formatOpenDuration(item.createdAt, locale),
      }),
      assignee: null,
      action: "assign",
      priority: item.priority,
      status: item.status,
    });
  }
  for (const item of attention.overdueCases) {
    push({
      id: item.id,
      href: `/app/cases/${item.id}${item.status === "resolved" ? "" : ""}`,
      property: item.property.name,
      title: item.title,
      waiting: interpolate(dict.dashboard.openFor, {
        duration: formatOpenDuration(item.createdAt, locale),
      }),
      assignee: item.contractor?.name ?? null,
      action: item.status === "resolved" ? "approve" : "openCase",
      priority: item.priority,
      status: item.status,
    });
  }
  return items;
}
