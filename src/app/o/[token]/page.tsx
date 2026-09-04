import Image from "next/image";
import { CleaningStatusBadge } from "@/components/cleaning-status";
import { StatusBadge } from "@/components/status-badge";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { getOwnerView } from "@/lib/data/store";
import { formatDate } from "@/lib/format";
import { categoryLabel } from "@/lib/labels";
import { CLOSED_STATUSES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OwnerViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const view = getOwnerView(token);

  if (!view) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 bg-canvas px-5 py-10">
        <h1 className="text-xl font-semibold text-navy-800">{dict.owner.notFound}</h1>
        <p className="text-sm text-muted-foreground">{dict.owner.notFoundHelp}</p>
      </main>
    );
  }

  const { property, cases, cleaning } = view;
  const openCases = cases.filter((c) => !CLOSED_STATUSES.includes(c.status));
  const closedCases = cases.filter((c) => CLOSED_STATUSES.includes(c.status));

  return (
    <div className="min-h-dvh bg-canvas">
      <main className="mx-auto w-full max-w-2xl space-y-4 px-5 py-6">
        <header>
          <p className="text-xs text-muted-foreground">{view.orgName}</p>
          <h1 className="mt-1 text-2xl font-semibold text-navy-800">{property.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {property.address}, {property.city}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{dict.owner.subtitle}</p>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-white px-4 py-3 shadow-soft">
            <p className="text-2xl font-semibold text-navy-800">{view.openCount}</p>
            <p className="text-xs text-muted-foreground">{dict.owner.openWork}</p>
          </div>
          <div className="rounded-2xl border border-border bg-white px-4 py-3 shadow-soft">
            <p className="text-2xl font-semibold text-navy-800">{view.approvedCount}</p>
            <p className="text-xs text-muted-foreground">{dict.owner.approvedWork}</p>
          </div>
          <div className="rounded-2xl border border-border bg-white px-4 py-3 shadow-soft">
            <p
              className={`text-sm font-medium ${
                property.guestReady ? "text-status-done" : "text-status-waiting"
              }`}
            >
              {property.guestReady ? dict.owner.ready : dict.owner.notReady}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{dict.owner.cleaning}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.owner.work}</h2>
          {cases.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{dict.owner.noWork}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {[...openCases, ...closedCases].map((item) => (
                <li key={item.id} className="rounded-xl border border-border/80 px-3 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy-800">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {categoryLabel(dict, item.category)} · {formatDate(item.createdAt, locale)}
                      </p>
                    </div>
                    <StatusBadge status={item.status} dict={dict} />
                  </div>
                  {item.costEstimate != null ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {dict.owner.cost}: {item.costEstimate}
                    </p>
                  ) : null}
                  {item.photos.length ? (
                    <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {item.photos.map((photo) => (
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
                                } – ${item.title}`
                              }
                              fill
                              sizes="140px"
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
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.owner.cleaning}</h2>
          {cleaning.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{dict.owner.noCleaning}</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {cleaning.map((job) => (
                <li
                  key={job.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-canvas px-3 py-2"
                >
                  <span className="text-sm text-navy-800">
                    {formatDate(job.scheduledAt, locale)}
                  </span>
                  <CleaningStatusBadge status={job.status} dict={dict} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="pb-4 text-xs text-muted-foreground">{dict.owner.privacy}</p>
      </main>
    </div>
  );
}
