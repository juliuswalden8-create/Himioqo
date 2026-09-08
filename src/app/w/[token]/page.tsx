import Image from "next/image";
import type { Metadata } from "next";
import {
  RespondButtons,
  StatusButtons,
  WorkMessageForm,
  WorkPhotoUpload,
} from "@/components/contractor/work-actions";
import { StatusBadge, PriorityBadge } from "@/components/status-badge";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { getCaseByWorkToken } from "@/lib/data/store";
import { categoryLabel } from "@/lib/labels";
import { pageMetadata } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.contractor.title);
}

export default async function ContractorTaskPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const item = getCaseByWorkToken(token);

  // A revoked, rotated or completed task simply stops resolving.
  if (!item) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 bg-canvas px-5 py-10">
        <h1 className="text-xl font-semibold text-navy-800">{dict.contractor.notFound}</h1>
        <p className="text-sm text-muted-foreground">{dict.contractor.notFoundHelp}</p>
      </main>
    );
  }

  const guestPhotos = item.attachments.filter((a) => a.kind === "reported");
  const beforePhotos = item.attachments.filter((a) => a.kind === "before");
  const afterPhotos = item.attachments.filter((a) => a.kind === "after");
  const responded = Boolean(item.contractorAcceptedAt);
  const finished = item.status === "resolved" || item.status === "approved";

  return (
    <div className="min-h-dvh bg-canvas">
      <main className="mx-auto w-full max-w-md space-y-4 px-5 py-6">
        <header>
          <p className="text-xs text-muted-foreground">{item.reference}</p>
          <h1 className="mt-1 text-xl font-semibold text-navy-800">{item.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {item.property.name} · {item.property.city}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={item.status} dict={dict} />
            <PriorityBadge priority={item.priority} dict={dict} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{dict.contractor.subtitle}</p>
        </header>

        <section className="rounded-2xl border border-border bg-white p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.contractor.task}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {categoryLabel(dict, item.category)} · {item.property.address}
          </p>
          <p className="mt-2 whitespace-pre-line text-sm text-navy-700">{item.description}</p>
          {item.workInstructions ? (
            <div className="mt-3 rounded-xl bg-canvas px-3 py-2">
              <p className="text-xs font-medium text-navy-700">
                {dict.contractor.instructions}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-navy-700">
                {item.workInstructions}
              </p>
            </div>
          ) : null}
        </section>

        {guestPhotos.length ? (
          <section className="rounded-2xl border border-border bg-white p-4 shadow-soft">
            <h2 className="text-sm font-semibold text-navy-800">
              {dict.contractor.guestPhotos}
            </h2>
            <ul className="mt-3 grid grid-cols-3 gap-2">
              {guestPhotos.map((photo) => (
                <li key={photo.id} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={photo.url}
                    alt={photo.caption || `${dict.contractor.guestPhotos} – ${item.reference}`}
                    fill
                    sizes="120px"
                    className="object-cover"
                    unoptimized
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-2xl border border-border bg-white p-4 shadow-soft">
          {item.status === "approved" ? (
            <p className="text-sm font-medium text-status-done">{dict.contractor.approved}</p>
          ) : !responded ? (
            <RespondButtons token={token} dict={dict} />
          ) : (
            <div className="space-y-3">
              <StatusButtons token={token} current={item.status} dict={dict} />
              {finished ? (
                <p className="text-sm text-status-done">{dict.contractor.completed}</p>
              ) : null}
            </div>
          )}
        </section>

        {responded ? (
          <>
            <section className="space-y-4 rounded-2xl border border-border bg-white p-4 shadow-soft">
              <div>
                <h2 className="text-sm font-semibold text-navy-800">
                  {dict.contractor.photosBefore}
                </h2>
                {beforePhotos.length ? (
                  <ul className="mt-2 grid grid-cols-3 gap-2">
                    {beforePhotos.map((photo) => (
                      <li
                        key={photo.id}
                        className="relative aspect-square overflow-hidden rounded-lg"
                      >
                        <Image
                          src={photo.url}
                          alt={photo.caption || `${dict.dashboard.before} – ${item.reference}`}
                          fill
                          sizes="120px"
                          className="object-cover"
                          unoptimized
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-3">
                  <WorkPhotoUpload
                    token={token}
                    kind="before"
                    label={dict.contractor.addBefore}
                    dict={dict}
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h2 className="text-sm font-semibold text-navy-800">
                  {dict.contractor.photosAfter}
                </h2>
                {afterPhotos.length ? (
                  <ul className="mt-2 grid grid-cols-3 gap-2">
                    {afterPhotos.map((photo) => (
                      <li
                        key={photo.id}
                        className="relative aspect-square overflow-hidden rounded-lg"
                      >
                        <Image
                          src={photo.url}
                          alt={photo.caption || `${dict.dashboard.after} – ${item.reference}`}
                          fill
                          sizes="120px"
                          className="object-cover"
                          unoptimized
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-3">
                  <WorkPhotoUpload
                    token={token}
                    kind="after"
                    label={dict.contractor.addAfter}
                    dict={dict}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-white p-4 shadow-soft">
              <h2 className="text-sm font-semibold text-navy-800">
                {dict.contractor.messages}
              </h2>
              {item.messages.length ? (
                <ul className="mt-3 space-y-3">
                  {item.messages.map((message) => (
                    <li key={message.id} className="rounded-xl bg-canvas px-3 py-2">
                      <p className="text-xs font-medium text-navy-700">{message.authorName}</p>
                      <p className="mt-1 text-sm text-navy-700">{message.text}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-3">
                <WorkMessageForm token={token} locale={locale} dict={dict} />
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
