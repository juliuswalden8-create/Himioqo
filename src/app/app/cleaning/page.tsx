import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { CleaningStatusBadge, ReadyBadge } from "@/components/cleaning-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { interpolate, getDictionary, getLocale } from "@/i18n/get-dictionary";
import {
  addCleanerAction,
  createCleaningJobAction,
  saveScheduleAction,
} from "@/lib/cleaning-actions";
import { checklistLabelsFromDict } from "@/lib/cleaning";
import {
  getOrganization,
  getProfile,
  listCleaners,
  listCleaningJobs,
  listCleaningSchedules,
  listProperties,
} from "@/lib/data/store";
import { getSession } from "@/lib/session";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CleaningPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const profile = getProfile(session.profileId);
  const org = getOrganization(session.organizationId);
  const locale = await getLocale();
  const dict = await getDictionary(profile?.locale || locale);
  const jobs = listCleaningJobs(session.organizationId);
  const properties = listProperties(session.organizationId);
  const cleaners = listCleaners(session.organizationId);
  const schedules = listCleaningSchedules(session.organizationId);
  const labels = JSON.stringify(checklistLabelsFromDict(dict.cleaning.checks));

  return (
    <div className="min-h-dvh bg-canvas">
      <AppHeader dict={dict} orgName={org?.name} current="cleaning" />
      <main className="container-page space-y-8 py-8">
        <PageHeader title={dict.cleaning.title} description={dict.cleaning.subtitle} />
        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          {jobs.length ? (
            <ul className="divide-y divide-border">
              {jobs.map((job) => {
                const done = job.checklist.filter((item) => item.done).length;
                return (
                  <li key={job.id}>
                    <Link
                      href={`/app/cleaning/${job.id}`}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-navy-800">
                          {job.property.name}
                          {job.cleaner ? ` · ${job.cleaner.name}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {interpolate(dict.cleaning.points, {
                            done: String(done),
                            total: String(job.checklist.length),
                          })}
                          {" · "}
                          {interpolate(dict.cleaning.photoCount, {
                            count: String(job.photos.length),
                          })}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {job.property.guestReady ? <ReadyBadge label={dict.dashboard.ready} /> : null}
                        <CleaningStatusBadge status={job.status} dict={dict} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{dict.cleaning.empty}</p>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <form
            action={createCleaningJobAction}
            className="space-y-3 rounded-2xl border border-border bg-white p-5 shadow-soft"
          >
            <h2 className="text-sm font-semibold text-navy-800">{dict.cleaning.create}</h2>
            <input type="hidden" name="labels" value={labels} />
            <Label htmlFor="propertyId">{dict.cleaning.property}</Label>
            <select
              id="propertyId"
              name="propertyId"
              required
              className="h-11 w-full rounded-xl border border-input bg-white px-3.5 text-sm"
            >
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
            <Label htmlFor="cleanerId">{dict.cleaning.cleaner}</Label>
            <select
              id="cleanerId"
              name="cleanerId"
              className="h-11 w-full rounded-xl border border-input bg-white px-3.5 text-sm"
            >
              <option value="">—</option>
              {cleaners.map((cleaner) => (
                <option key={cleaner.id} value={cleaner.id}>
                  {cleaner.name}
                </option>
              ))}
            </select>
            <Label htmlFor="scheduledAt">{dict.cleaning.when}</Label>
            <Input id="scheduledAt" name="scheduledAt" type="datetime-local" />
            <Label htmlFor="instructions">{dict.cleaning.instructions}</Label>
            <Textarea id="instructions" name="instructions" />
            <p className="text-xs text-muted-foreground">{dict.cleaning.noAccount}</p>
            <Button type="submit">{dict.cleaning.assign}</Button>
          </form>

          <div className="space-y-6">
            <form
              action={addCleanerAction}
              className="space-y-3 rounded-2xl border border-border bg-white p-5 shadow-soft"
            >
              <h2 className="text-sm font-semibold text-navy-800">{dict.cleaning.addCleaner}</h2>
              <Label htmlFor="name">{dict.cleaning.cleanerName}</Label>
              <Input id="name" name="name" required />
              <Label htmlFor="contactName">{dict.cleaning.contact}</Label>
              <Input id="contactName" name="contactName" required />
              <Label htmlFor="phone">{dict.contractorForm.phone}</Label>
              <Input id="phone" name="phone" />
              <Label htmlFor="email">{dict.contractorForm.email}</Label>
              <Input id="email" name="email" type="email" />
              <Button type="submit" variant="secondary">
                {dict.cleaning.addCleaner}
              </Button>
            </form>

            <form
              action={saveScheduleAction}
              className="space-y-3 rounded-2xl border border-border bg-white p-5 shadow-soft"
            >
              <h2 className="text-sm font-semibold text-navy-800">{dict.cleaning.schedule}</h2>
              <Label htmlFor="sch-property">{dict.cleaning.property}</Label>
              <select
                id="sch-property"
                name="propertyId"
                required
                className="h-11 w-full rounded-xl border border-input bg-white px-3.5 text-sm"
              >
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
              <Label htmlFor="sch-cleaner">{dict.cleaning.cleaner}</Label>
              <select
                id="sch-cleaner"
                name="cleanerId"
                className="h-11 w-full rounded-xl border border-input bg-white px-3.5 text-sm"
              >
                <option value="">—</option>
                {cleaners.map((cleaner) => (
                  <option key={cleaner.id} value={cleaner.id}>
                    {cleaner.name}
                  </option>
                ))}
              </select>
              <Label htmlFor="offsetHours">{dict.cleaning.offset}</Label>
              <Input id="offsetHours" name="offsetHours" type="number" min={0} defaultValue={2} />
              <Label htmlFor="sch-instructions">{dict.cleaning.instructions}</Label>
              <Textarea id="sch-instructions" name="instructions" />
              <p className="text-xs text-muted-foreground">{dict.cleaning.afterCheckout}</p>
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
