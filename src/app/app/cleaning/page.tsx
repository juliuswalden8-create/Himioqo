import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AppListRow } from "@/components/app-list-row";
import { CreateCleaningDialog } from "@/components/create-cleaning-dialog";
import { PageHeader } from "@/components/page-header";
import { CleaningStatusBadge, ReadyBadge } from "@/components/cleaning-status";
import { Button } from "@/components/ui/button";
import { FormField, NativeSelect } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Metadata } from "next";
import { interpolate, getDictionary, getLocale } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/page-metadata";
import { createCleaningJobAction, saveScheduleAction } from "@/lib/cleaning-actions";
import { checklistLabelsFromDict } from "@/lib/cleaning";
import {
  getOrganization,
  listCleaners,
  listCleaningJobs,
  listCleaningSchedules,
  listProperties,
} from "@/lib/data/store";
import { formatDate, formatTime } from "@/lib/format";
import { cleaningBucket } from "@/lib/ops-attention";
import { getSession } from "@/lib/session";
import type { CleaningJobWithRelations } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.cleaning.title);
}

export default async function CleaningPage() {
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
  const groups = {
    overdue: jobs.filter((job) => cleaningBucket(job) === "overdue"),
    today: jobs.filter((job) => cleaningBucket(job) === "today"),
    upcoming: jobs.filter((job) => cleaningBucket(job) === "upcoming"),
    done: jobs.filter((job) => cleaningBucket(job) === "done"),
  };

  function JobList({ items }: { items: CleaningJobWithRelations[] }) {
    return (
      <ul>
        {items.map((job) => {
          const done = job.checklist.filter((item) => item.done).length;
          const jobDone = cleaningBucket(job) === "done";
          return (
            <AppListRow
              key={job.id}
              href={`/app/cleaning/${job.id}`}
              badges={
                <>
                  {jobDone ? null : job.property.guestReady ? (
                    <ReadyBadge label={dict.dashboard.ready} />
                  ) : (
                    <span className="text-xs text-muted-foreground">{dict.dashboard.notReady}</span>
                  )}
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
              <p className="truncate text-sm font-medium text-navy-800">{job.property.name}</p>
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
    );
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <AppHeader dict={dict} orgName={org?.name} current="cleaning" />
      <main className="container-page space-y-8 py-8">
        <PageHeader
          title={dict.cleaning.title}
          description={dict.cleaning.subtitle}
          actions={
            <CreateCleaningDialog title={dict.cleaning.create} trigger={dict.cleaning.createJob}>
              <form action={createCleaningJobAction} className="space-y-5">
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
            </CreateCleaningDialog>
          }
        />

        {jobs.length ? (
          <div className="space-y-6">
            {[
              { key: "overdue" as const, title: dict.cleaning.groupOverdue, items: groups.overdue },
              { key: "today" as const, title: dict.cleaning.groupToday, items: groups.today },
              { key: "upcoming" as const, title: dict.cleaning.groupUpcoming, items: groups.upcoming },
              { key: "done" as const, title: dict.cleaning.tabDone, items: groups.done },
            ]
              .filter((group) => group.items.length)
              .map((group) => (
                <section key={group.key} className="rounded-2xl border border-border bg-white px-5 shadow-soft">
                  <h2 className="pt-4 text-sm font-semibold text-navy-800">
                    {group.title} ({group.items.length})
                  </h2>
                  <JobList items={group.items} />
                </section>
              ))}
          </div>
        ) : (
          <section className="rounded-2xl border border-border bg-white px-5 shadow-soft">
            <p className="py-5 text-sm text-muted-foreground">{dict.cleaning.empty}</p>
          </section>
        )}

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
      </main>
    </div>
  );
}
