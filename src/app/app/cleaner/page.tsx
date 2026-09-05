import Link from "next/link";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { StaffHeader } from "@/components/staff-header";
import { CleaningStatusBadge } from "@/components/cleaning-status";
import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/page-metadata";
import { interpolate } from "@/i18n/interpolate";
import { listCleaningJobsForMembership } from "@/lib/data/store";
import { formatDateTime } from "@/lib/format";
import { requireRoleSession } from "@/lib/session";
import { isToday, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.access.cleanerHome);
}

export default async function CleanerDashboardPage() {
  const session = await requireRoleSession("cleaner");
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const jobs = listCleaningJobsForMembership(session.membership);
  const today = jobs.filter((job) => isToday(parseISO(job.scheduledAt)));
  const later = jobs.filter((job) => !isToday(parseISO(job.scheduledAt)));

  function JobList({ items }: { items: typeof jobs }) {
    return (
      <ul className="space-y-3">
        {items.map((job) => {
          const done = job.checklist.filter((item) => item.done).length;
          return (
            <li key={job.id}>
              <Link
                href={`/app/cleaner/${job.id}`}
                className="block min-h-20 rounded-3xl border border-border bg-white px-5 py-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-navy-800">{job.property.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {job.property.address}, {job.property.city}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDateTime(job.scheduledAt, locale)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {interpolate(dict.cleaning.points, {
                        done: String(done),
                        total: String(job.checklist.length),
                      })}
                    </p>
                  </div>
                  <CleaningStatusBadge status={job.status} dict={dict} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <StaffHeader dict={dict} title={dict.access.cleanerHome} />
      <main className="container-page space-y-4 py-8">
        {jobs.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title={dict.access.cleanerEmpty}
            description={dict.cleaning.portalHelp}
          />
        ) : (
          <div className="space-y-6">
            {today.length ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-navy-800">{dict.cleaning.today}</h2>
                <JobList items={today} />
              </section>
            ) : null}
            {later.length ? (
              <section className="space-y-3">
                {today.length ? (
                  <h2 className="text-sm font-semibold text-navy-800">{dict.cleaning.later}</h2>
                ) : null}
                <JobList items={later} />
              </section>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
