import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { CleaningPhotoUpload } from "@/components/cleaning-photo-upload";
import {
  CleanerStatusButtons,
  CleaningIssueForm,
  CleaningTimeForm,
} from "@/components/cleaning/cleaner-controls";
import { CleaningStatusBadge } from "@/components/cleaning-status";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { interpolate } from "@/i18n/interpolate";
import { pageMetadata } from "@/lib/page-metadata";
import { toggleCheckAction } from "@/lib/cleaning-actions";
import { getCleaningJobByToken } from "@/lib/data/store";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.cleaning.portalTitle);
}

export default async function CleanerPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const job = getCleaningJobByToken(token);
  if (!job) notFound();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const locked = job.status === "approved";

  return (
    <div className="min-h-dvh bg-canvas px-4 py-8">
      <div className="mx-auto max-w-md">
        <Logo />
        <div className="mt-6 rounded-3xl border border-border bg-white p-6 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-navy-800">{dict.cleaning.portalTitle}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{job.property.name}</p>
            </div>
            <CleaningStatusBadge status={job.status} dict={dict} />
          </div>
          <p className="mt-3 text-sm text-navy-700">
            {job.property.address}, {job.property.city}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {dict.cleaning.when}: {formatDateTime(job.scheduledAt, locale)}
          </p>
          {job.instructions ? (
            <p className="mt-3 text-sm leading-relaxed text-navy-700">{job.instructions}</p>
          ) : null}
          {job.returnComment ? (
            <p className="mt-3 rounded-xl bg-status-waiting/10 px-3 py-2 text-sm text-navy-800">
              {job.returnComment}
            </p>
          ) : null}
          <p className="mt-3 text-xs text-muted-foreground">{dict.cleaning.portalHelp}</p>

          {!locked ? (
            <div className="mt-4">
              <CleanerStatusButtons token={token} current={job.status} dict={dict} />
              <CleaningTimeForm token={token} minutes={job.minutesWorked} dict={dict} />
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
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="done" value={item.done ? "false" : "true"} />
                  <button
                    type="submit"
                    disabled={locked}
                    className="flex w-full items-center gap-3 rounded-xl border border-border px-3 py-2 text-left text-sm"
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
            {job.photos.length ? (
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {job.photos.map((photo) => (
                  <li key={photo.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={
                        photo.caption ||
                        `${
                          photo.kind === "before"
                            ? dict.dashboard.before
                            : dict.dashboard.after
                        } – ${job.property.name}`
                      }
                      className="h-24 w-full rounded-lg object-cover"
                    />
                  </li>
                ))}
              </ul>
            ) : null}
            {!locked ? (
              <div className="mt-3">
                <CleaningPhotoUpload token={token} dict={dict} />
              </div>
            ) : null}
          </div>

          {!locked ? <CleaningIssueForm token={token} dict={dict} /> : null}

          {job.issues.length ? (
            <ul className="mt-4 space-y-1 text-sm text-navy-700">
              {job.issues.map((issue) => (
                <li key={issue.id}>{issue.text}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
