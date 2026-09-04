import Link from "next/link";
import { notFound } from "next/navigation";
import { CleaningPhotoUpload } from "@/components/cleaning-photo-upload";
import {
  CleanerStatusButtons,
  CleaningIssueForm,
  CleaningTimeForm,
} from "@/components/cleaning/cleaner-controls";
import { CleaningStatusBadge } from "@/components/cleaning-status";
import { StaffHeader } from "@/components/staff-header";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { interpolate } from "@/i18n/interpolate";
import { toggleCheckAction } from "@/lib/cleaning-actions";
import { cleanerMayAccessJob, getCleaningJob } from "@/lib/data/store";
import { formatDateTime } from "@/lib/format";
import { requireRoleSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CleanerJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRoleSession("cleaner");
  const { id } = await params;
  const job = getCleaningJob(session.organizationId, id);
  if (!job || !cleanerMayAccessJob(session.membership, job)) notFound();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const locked = job.status === "approved";

  return (
    <div className="min-h-dvh bg-canvas">
      <StaffHeader dict={dict} title={dict.access.cleanerHome} />
      <main className="container-page max-w-md space-y-4 py-6">
        <Link href="/app/cleaner" className="text-sm font-medium text-navy-700 underline">
          {dict.guide.back}
        </Link>
        <div className="rounded-3xl border border-border bg-white p-6 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-navy-800">{job.property.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {job.property.address}, {job.property.city}
              </p>
            </div>
            <CleaningStatusBadge status={job.status} dict={dict} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {dict.cleaning.when}: {formatDateTime(job.scheduledAt, locale)}
          </p>
          {job.instructions ? (
            <p className="mt-3 text-sm leading-relaxed text-navy-700">{job.instructions}</p>
          ) : null}
          {!locked ? (
            <div className="mt-4">
              <CleanerStatusButtons jobId={job.id} current={job.status} dict={dict} />
              <CleaningTimeForm jobId={job.id} minutes={job.minutesWorked} dict={dict} />
            </div>
          ) : job.minutesWorked != null ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {interpolate(dict.cleaning.minutesValue, { minutes: String(job.minutesWorked) })}
            </p>
          ) : null}
          <ul className="mt-5 space-y-2">
            {job.checklist.map((item) => (
              <li key={item.id}>
                <form action={toggleCheckAction}>
                  <input type="hidden" name="jobId" value={job.id} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="done" value={item.done ? "false" : "true"} />
                  <button
                    type="submit"
                    disabled={locked}
                    className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border px-3 py-2 text-left text-sm"
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                        item.done
                          ? "border-green-600 bg-green-50 text-xs text-green-700"
                          : "border-input bg-white"
                      }`}
                    >
                      {item.done ? "✓" : ""}
                    </span>
                    {item.label}
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-navy-800">{dict.cleaning.photos}</h2>
            {!locked ? (
              <div className="mt-3">
                <CleaningPhotoUpload jobId={job.id} dict={dict} />
              </div>
            ) : null}
          </div>
          {!locked ? <CleaningIssueForm jobId={job.id} dict={dict} /> : null}
        </div>
      </main>
    </div>
  );
}
