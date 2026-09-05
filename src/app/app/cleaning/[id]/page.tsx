import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { CleaningStatusBadge, CopyLinkButton, ReadyBadge } from "@/components/cleaning-status";
import { SafePhoto } from "@/components/safe-photo";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { Metadata } from "next";
import { interpolate, getDictionary, getLocale } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/page-metadata";
import { approveCleaningAction, returnCleaningAction } from "@/lib/cleaning-actions";
import {
  getCleaningJob,
  getOrganization,
  markCleaningNoticeRead,
} from "@/lib/data/store";
import { formatDateTime } from "@/lib/format";
import { getRequestOrigin } from "@/lib/request-origin";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.cleaning.title);
}

export default async function CleaningDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const job = getCleaningJob(session.organizationId, id);
  if (!job) notFound();
  markCleaningNoticeRead(session.organizationId, job.id);

  const org = getOrganization(session.organizationId);
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const origin = await getRequestOrigin();
  const link = `${origin}/c/${job.accessToken}`;
  const done = job.checklist.filter((item) => item.done).length;

  return (
    <div className="min-h-dvh bg-canvas">
      <AppHeader dict={dict} orgName={org?.name} current="cleaning" />
      <main className="container-page max-w-2xl space-y-6 py-8">
        <div>
          <Link href="/app/cleaning" className="text-sm text-navy-700 hover:underline">
            {dict.dashboard.allCleaning}
          </Link>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-navy-800">
                {dict.dashboard.cleaning} · {job.property.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {job.property.address}, {job.property.city}
                {job.cleaner ? ` · ${job.cleaner.name}` : ""}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {dict.cleaning.when}: {formatDateTime(job.scheduledAt)}
              </p>
              {job.minutesWorked != null ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {interpolate(dict.cleaning.minutesValue, { minutes: String(job.minutesWorked) })}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-2">
              {job.status === "completed" || job.status === "approved" ? null : job.property.guestReady ? (
                <ReadyBadge label={dict.dashboard.ready} />
              ) : null}
              <CleaningStatusBadge status={job.status} dict={dict} />
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <p className="text-sm leading-relaxed text-navy-700">{job.instructions}</p>
          <p className="mt-3 text-sm text-muted-foreground">{dict.cleaning.noAccount}</p>
          <div className="mt-3">
            <CopyLinkButton url={link} dict={dict} />
          </div>
        </section>

        <section id="checklist" className="scroll-mt-24 rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.cleaning.checklist}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {interpolate(dict.cleaning.points, {
              done: String(done),
              total: String(job.checklist.length),
            })}
          </p>
          <ul className="mt-3 space-y-2">
            {job.checklist.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm text-navy-800">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                    item.done ? "border-green-600 bg-green-50 text-[10px] text-green-700" : "border-input"
                  }`}
                >
                  {item.done ? "✓" : ""}
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </section>

        <section
          id="documentation"
          className="scroll-mt-24 rounded-2xl border border-border bg-white p-5 shadow-soft"
        >
          <h2 className="text-sm font-semibold text-navy-800">{dict.cleaning.photos}</h2>
          {job.photos.length ? (
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {job.photos.map((photo) => (
                <li key={photo.id}>
                  <SafePhoto
                    src={photo.url}
                    alt={photo.caption ?? (photo.kind === "before" ? dict.dashboard.before : dict.dashboard.after)}
                    fallbackLabel={dict.dashboard.photoFallback}
                    className="h-24 w-full rounded-lg object-cover"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {photo.kind === "before" ? dict.dashboard.before : dict.dashboard.after}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">{dict.dashboard.noPhotos}</p>
          )}
        </section>

        {job.issues.length ? (
          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-sm font-semibold text-navy-800">{dict.cleaning.issue}</h2>
            <ul className="mt-3 space-y-2">
              {job.issues.map((issue) => (
                <li key={issue.id} className="text-sm text-navy-800">
                  {issue.text}
                  {issue.convertedCaseId ? (
                    <Link
                      href={`/app/cases/${issue.convertedCaseId}`}
                      className="ml-2 text-xs text-navy-600 underline"
                    >
                      {dict.dashboard.allCases}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {job.returnComment ? (
          <p className="text-sm text-muted-foreground">
            {dict.cleaning.returnComment}: {job.returnComment}
          </p>
        ) : null}

        {job.status === "approved" ? (
          <p className="text-sm text-green-700">{dict.cleaning.approved}</p>
        ) : job.status === "completed" || job.status === "returned" ? (
          <section className="space-y-3 rounded-2xl border border-border bg-white p-5 shadow-soft">
            <form action={approveCleaningAction}>
              <input type="hidden" name="jobId" value={job.id} />
              <Button type="submit">{dict.cleaning.approve}</Button>
            </form>
            <form action={returnCleaningAction} className="space-y-5">
              <input type="hidden" name="jobId" value={job.id} />
              <FormField label={dict.cleaning.returnComment} htmlFor="return-comment" required>
                <Textarea id="return-comment" name="comment" required />
              </FormField>
              <Button type="submit" variant="secondary">
                {dict.cleaning.return}
              </Button>
            </form>
          </section>
        ) : null}
      </main>
    </div>
  );
}
