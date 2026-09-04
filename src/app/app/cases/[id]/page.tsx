import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { NotesPanel, TriagePanel, WorkLinkPanel } from "@/components/case/triage-panel";
import { TranslatableText } from "@/components/translatable-text";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import {
  approveCaseAction,
  reopenCaseAction,
  sendOwnerMessageAction,
} from "@/lib/actions";
import {
  getCase,
  getOrganization,
  getProfile,
  listContractors,
} from "@/lib/data/store";
import { formatDate } from "@/lib/format";
import { localizeForViewer } from "@/lib/i18n/translate";
import { categoryLabel } from "@/lib/labels";
import { getSession } from "@/lib/session";
import { appUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const item = getCase(session.organizationId, id);
  if (!item) notFound();

  const profile = getProfile(session.profileId);
  const org = getOrganization(session.organizationId);
  const locale = await getLocale();
  const viewerLocale = profile?.locale || locale;
  const dict = await getDictionary(viewerLocale);
  const contractors = listContractors(session.organizationId);

  const description = await localizeForViewer(item.description, "sv", viewerLocale);
  const messages = await Promise.all(
    item.messages.map(async (message) => {
      const original = message.originalText ?? message.text;
      if (message.translated && message.originalText && message.originalText !== message.text) {
        return {
          message,
          localized: {
            text: message.text,
            originalText: message.originalText,
            translated: true,
          },
        };
      }
      const localized = await localizeForViewer(
        original,
        message.originalLocale ?? "sv",
        viewerLocale,
      );
      if (localized.translated) {
        message.text = localized.text;
        message.originalText = original;
        message.translated = true;
      }
      return { message, localized };
    }),
  );

  const guestPhotos = item.attachments.filter((a) => a.kind === "reported");
  const workPhotos = item.attachments.filter((a) => a.kind !== "reported");
  const awaitingApproval = item.status === "resolved";

  return (
    <div className="min-h-dvh bg-canvas">
      <AppHeader dict={dict} orgName={org?.name} current="cases" />
      <main className="container-page max-w-3xl space-y-6 py-8">
        <div>
          <Link href="/app/cases" className="text-sm text-navy-700 hover:underline">
            {dict.dashboard.allCases}
          </Link>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{item.reference}</p>
              <h1 className="mt-1 text-2xl font-semibold text-navy-800">{item.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                <Link
                  href={`/app/properties/${item.propertyId}`}
                  className="hover:underline"
                >
                  {item.property.name}
                </Link>
                {item.contractor ? ` · ${item.contractor.name}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={item.status} dict={dict} />
              <PriorityBadge priority={item.priority} dict={dict} />
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">{dict.caseDetail.category}</dt>
              <dd className="text-navy-800">{categoryLabel(dict, item.category)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">{dict.caseDetail.reported}</dt>
              <dd className="text-navy-800">{formatDate(item.createdAt)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">{dict.caseDetail.reportedBy}</dt>
              <dd className="truncate text-navy-800">{item.reporterName || "—"}</dd>
            </div>
            {item.dueAt ? (
              <div className="flex gap-2">
                <dt className="text-muted-foreground">{dict.caseDetail.due}</dt>
                <dd className="text-navy-800">{formatDate(item.dueAt)}</dd>
              </div>
            ) : null}
            {item.costEstimate != null ? (
              <div className="flex gap-2">
                <dt className="text-muted-foreground">{dict.caseDetail.cost}</dt>
                <dd className="text-navy-800">{item.costEstimate}</dd>
              </div>
            ) : null}
          </dl>
          <div className="mt-4 border-t border-border pt-4">
            <TranslatableText
              text={description.text}
              originalText={description.originalText}
              showOriginalLabel={dict.dashboard.showOriginal}
              showTranslatedLabel={dict.dashboard.showTranslated}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.caseDetail.triage}</h2>
          <div className="mt-4">
            <TriagePanel
              caseId={item.id}
              status={item.status}
              priority={item.priority}
              contractorId={item.contractorId}
              instructions={item.workInstructions}
              dueAt={item.dueAt}
              costEstimate={item.costEstimate}
              contractors={contractors.map((c) => ({
                id: c.id,
                name: c.name,
                trade: c.trade,
              }))}
              dict={dict}
            />
          </div>

          {item.workToken ? (
            <div className="mt-4 border-t border-border pt-4">
              <WorkLinkPanel
                caseId={item.id}
                url={appUrl(`/w/${item.workToken}`)}
                dict={dict}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {item.contractorAcceptedAt
                  ? dict.caseDetail.accepted.replace(
                      "{date}",
                      formatDate(item.contractorAcceptedAt),
                    )
                  : dict.caseDetail.awaitingResponse}
              </p>
            </div>
          ) : null}

          {item.contractorDeclinedAt ? (
            <p className="mt-3 rounded-xl bg-status-waiting/10 px-3 py-2 text-sm text-status-waiting">
              {dict.caseDetail.declined}
              {item.declineReason ? ` · ${item.declineReason}` : ""}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            {awaitingApproval ? (
              <form action={approveCaseAction}>
                <input type="hidden" name="caseId" value={item.id} />
                <Button type="submit">{dict.caseDetail.approve}</Button>
              </form>
            ) : null}
            {item.status === "approved" || item.status === "resolved" ? (
              <form action={reopenCaseAction}>
                <input type="hidden" name="caseId" value={item.id} />
                <Button type="submit" variant="secondary">
                  {dict.caseDetail.reopen}
                </Button>
              </form>
            ) : null}
          </div>
          {awaitingApproval ? (
            <p className="mt-2 text-xs text-muted-foreground">{dict.caseDetail.approveHelp}</p>
          ) : null}
        </section>

        {guestPhotos.length || workPhotos.length ? (
          <section className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-soft">
            {guestPhotos.length ? (
              <div>
                <h2 className="text-sm font-semibold text-navy-800">
                  {dict.caseDetail.guestPhotos}
                </h2>
                <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {guestPhotos.map((photo) => (
                    <li
                      key={photo.id}
                      className="relative aspect-square overflow-hidden rounded-lg"
                    >
                      <Image
                        src={photo.url}
                        alt={
                          photo.caption ||
                          `${dict.caseDetail.guestPhotos} – ${item.reference}`
                        }
                        fill
                        sizes="160px"
                        className="object-cover"
                        unoptimized
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {workPhotos.length ? (
              <div>
                <h2 className="text-sm font-semibold text-navy-800">
                  {dict.caseDetail.beforeAfter}
                </h2>
                <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {workPhotos.map((photo) => (
                    <li key={photo.id}>
                      <div className="relative aspect-square overflow-hidden rounded-lg">
                        <Image
                          src={photo.url}
                          alt={
                            photo.caption ||
                            `${
                              photo.kind === "before"
                                ? dict.dashboard.before
                                : dict.dashboard.after
                            } – ${item.reference}`
                          }
                          fill
                          sizes="160px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {photo.kind === "before"
                          ? dict.dashboard.before
                          : dict.dashboard.after}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <NotesPanel
            caseId={item.id}
            notes={item.notes.map((note) => ({
              id: note.id,
              authorName: note.authorName,
              text: note.text,
              createdAt: note.createdAt,
            }))}
            dict={dict}
          />
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.dashboard.messages}</h2>
          <ul className="mt-4 space-y-4">
            {messages.map(({ message, localized }) => (
              <li key={message.id} className="rounded-xl bg-canvas px-3 py-2">
                <p className="text-xs font-medium text-navy-700">{message.authorName}</p>
                <div className="mt-1">
                  <TranslatableText
                    text={localized.text}
                    originalText={localized.originalText}
                    showOriginalLabel={dict.dashboard.showOriginal}
                    showTranslatedLabel={dict.dashboard.showTranslated}
                  />
                </div>
              </li>
            ))}
          </ul>
          <form action={sendOwnerMessageAction} className="mt-4 space-y-2">
            <input type="hidden" name="caseId" value={item.id} />
            <FormField label={dict.dashboard.reply} htmlFor="case-reply" required>
              <Textarea
                id="case-reply"
                name="text"
                required
                maxLength={2000}
              />
            </FormField>
            <Button type="submit">{dict.dashboard.send}</Button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.caseDetail.timeline}</h2>
          <ol className="mt-4 space-y-3">
            {item.activity.map((event) => (
              <li key={event.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-300" />
                <div className="min-w-0">
                  <p className="text-navy-800">{event.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.actorName} · {formatDate(event.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
