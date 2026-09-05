import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AppListRow } from "@/components/app-list-row";
import { PageHeader } from "@/components/page-header";
import { CleaningStatusBadge, ReadyBadge } from "@/components/cleaning-status";
import { Button } from "@/components/ui/button";
import { FormField, NativeSelect } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Metadata } from "next";
import { interpolate, getDictionary, getLocale } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/page-metadata";
import {
  addCleanerAction,
  createCleaningJobAction,
  saveScheduleAction,
} from "@/lib/cleaning-actions";
import { checklistLabelsFromDict } from "@/lib/cleaning";
import {
  getOrganization,
  listCleaners,
  listCleaningJobs,
  listCleaningSchedules,
  listProperties,
} from "@/lib/data/store";
import { formatDate, formatTime } from "@/lib/format";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import type { CleaningStatus } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.cleaning.title);
}

const PLANNED: CleaningStatus[] = ["scheduled", "accepted"];
const ACTIVE: CleaningStatus[] = ["in_progress", "returned"];
const DONE: CleaningStatus[] = ["completed", "approved"];

export default async function CleaningPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const org = getOrganization(session.organizationId);
  const locale = await getLocale();
  const viewerLocale = locale;
  const dict = await getDictionary(viewerLocale);
  const jobs = listCleaningJobs(session.organizationId);
  const properties = listProperties(session.organizationId);
  const cleaners = listCleaners(session.organizationId);
  const schedules = listCleaningSchedules(session.organizationId);
  const labels = JSON.stringify(checklistLabelsFromDict(dict.cleaning.checks));
  const sp = await searchParams;
  const tabRaw = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const tab = tabRaw === "planned" || tabRaw === "active" || tabRaw === "done" ? tabRaw : "all";
  const visible = jobs.filter((job) => {
    if (tab === "planned") return PLANNED.includes(job.status);
    if (tab === "active") return ACTIVE.includes(job.status);
    if (tab === "done") return DONE.includes(job.status);
    return true;
  });
  const tabs = [
    { id: "all" as const, label: dict.cleaning.tabAll, count: jobs.length },
    {
      id: "planned" as const,
      label: dict.cleaning.tabPlanned,
      count: jobs.filter((job) => PLANNED.includes(job.status)).length,
    },
    {
      id: "active" as const,
      label: dict.cleaning.tabActive,
      count: jobs.filter((job) => ACTIVE.includes(job.status)).length,
    },
    {
      id: "done" as const,
      label: dict.cleaning.tabDone,
      count: jobs.filter((job) => DONE.includes(job.status)).length,
    },
  ];

  return (
    <div className="min-h-dvh bg-canvas">
      <AppHeader dict={dict} orgName={org?.name} current="cleaning" />
      <main className="container-page space-y-8 py-8">
        <PageHeader
          title={dict.cleaning.title}
          description={dict.cleaning.subtitle}
          actions={
            <Button asChild variant="cta">
              <a href="#create">{dict.cleaning.createJob}</a>
            </Button>
          }
        />
        <nav className="flex gap-2 overflow-x-auto">
          {tabs.map((item) => (
            <Link
              key={item.id}
              href={item.id === "all" ? "/app/cleaning" : `/app/cleaning?tab=${item.id}`}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium",
                tab === item.id
                  ? "bg-ocean text-white"
                  : "bg-white text-navy-700 ring-1 ring-border",
              )}
            >
              {item.label} ({item.count})
            </Link>
          ))}
        </nav>
        <section className="rounded-2xl border border-border bg-white px-5 shadow-soft">
          {visible.length ? (
            <ul>
              {visible.map((job) => {
                const done = job.checklist.filter((item) => item.done).length;
                const jobDone = DONE.includes(job.status);
                return (
                  <AppListRow
                    key={job.id}
                    href={`/app/cleaning/${job.id}`}
                    badges={
                      <>
                        {jobDone ? null : job.property.guestReady ? (
                          <ReadyBadge label={dict.dashboard.ready} />
                        ) : null}
                        <CleaningStatusBadge status={job.status} dict={dict} />
                      </>
                    }
                    actions={
                      <>
                        <Button asChild size="sm" variant="secondary">
                          <Link href={`/app/cleaning/${job.id}#checklist`}>
                            {dict.cleaning.openChecklist}
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="secondary">
                          <Link href={`/app/cleaning/${job.id}#documentation`}>
                            {dict.cleaning.viewDocs}
                          </Link>
                        </Button>
                      </>
                    }
                  >
                    <p className="truncate text-sm font-medium text-navy-800">
                      {job.property.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {interpolate(dict.cleaning.scheduledFor, {
                        date: formatDate(job.scheduledAt, viewerLocale),
                        time: formatTime(job.scheduledAt, viewerLocale),
                      })}
                      {job.completedAt
                        ? ` · ${interpolate(dict.cleaning.endedAt, {
                            time: formatTime(job.completedAt, viewerLocale),
                          })}`
                        : ""}
                      {" · "}
                      {job.cleaner?.name ?? dict.cleaning.unassigned}
                    </p>
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
            <p className="py-5 text-sm text-muted-foreground">{dict.cleaning.empty}</p>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <form
            id="create"
            action={createCleaningJobAction}
            className="space-y-5 scroll-mt-24 rounded-2xl border border-border bg-white p-5 shadow-soft"
          >
            <h2 className="text-sm font-semibold text-navy-800">{dict.cleaning.create}</h2>
            <input type="hidden" name="labels" value={labels} />
            <FormField label={dict.cleaning.property} htmlFor="propertyId" required>
              <NativeSelect id="propertyId" name="propertyId" required>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label={dict.cleaning.cleaner} htmlFor="cleanerId">
              <NativeSelect id="cleanerId" name="cleanerId">
                <option value="">—</option>
                {cleaners.map((cleaner) => (
                  <option key={cleaner.id} value={cleaner.id}>
                    {cleaner.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label={dict.cleaning.when} htmlFor="scheduledAt">
              <Input id="scheduledAt" name="scheduledAt" type="datetime-local" />
            </FormField>
            <FormField label={dict.cleaning.instructions} htmlFor="instructions" hint={dict.cleaning.noAccount}>
              <Textarea id="instructions" name="instructions" />
            </FormField>
            <Button type="submit" variant="cta">
              {dict.cleaning.createJob}
            </Button>
          </form>

          <div className="space-y-6">
            <form
              action={addCleanerAction}
              className="space-y-5 rounded-2xl border border-border bg-white p-5 shadow-soft"
            >
              <h2 className="text-sm font-semibold text-navy-800">{dict.cleaning.addCleaner}</h2>
              <FormField label={dict.cleaning.cleanerName} htmlFor="name" required>
                <Input id="name" name="name" required />
              </FormField>
              <FormField label={dict.cleaning.contact} htmlFor="contactName" required>
                <Input id="contactName" name="contactName" required />
              </FormField>
              <FormField label={dict.contractorForm.phone} htmlFor="phone">
                <Input id="phone" name="phone" />
              </FormField>
              <FormField label={dict.contractorForm.email} htmlFor="email">
                <Input id="email" name="email" type="email" />
              </FormField>
              <Button type="submit" variant="secondary">
                {dict.cleaning.addCleaner}
              </Button>
            </form>

            <form
              action={saveScheduleAction}
              className="space-y-5 rounded-2xl border border-border bg-white p-5 shadow-soft"
            >
              <h2 className="text-sm font-semibold text-navy-800">{dict.cleaning.schedule}</h2>
              <FormField label={dict.cleaning.property} htmlFor="sch-property" required>
                <NativeSelect id="sch-property" name="propertyId" required>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField label={dict.cleaning.cleaner} htmlFor="sch-cleaner">
                <NativeSelect id="sch-cleaner" name="cleanerId">
                  <option value="">—</option>
                  {cleaners.map((cleaner) => (
                    <option key={cleaner.id} value={cleaner.id}>
                      {cleaner.name}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField label={dict.cleaning.offset} htmlFor="offsetHours">
                <Input id="offsetHours" name="offsetHours" type="number" min={0} defaultValue={2} />
              </FormField>
              <FormField
                label={dict.cleaning.instructions}
                htmlFor="sch-instructions"
                hint={dict.cleaning.afterCheckout}
              >
                <Textarea id="sch-instructions" name="instructions" />
              </FormField>
              {schedules.length ? (
                <p className="text-xs text-green-700">{dict.cleaning.scheduled}</p>
              ) : null}
              <Button type="submit" variant="secondary">
                {dict.cleaning.saveSchedule}
              </Button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
