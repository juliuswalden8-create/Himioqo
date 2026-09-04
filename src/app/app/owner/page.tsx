import Link from "next/link";
import { Home } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { StaffHeader } from "@/components/staff-header";
import { CleaningStatusBadge } from "@/components/cleaning-status";
import { StatusBadge } from "@/components/status-badge";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { getOwnerViewsForMembership } from "@/lib/data/store";
import { formatDate } from "@/lib/format";
import { requireRoleSession } from "@/lib/session";
import { CLOSED_STATUSES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OwnerDashboardPage() {
  const session = await requireRoleSession("owner");
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const views = getOwnerViewsForMembership(session.membership);

  return (
    <div className="min-h-dvh bg-canvas">
      <StaffHeader dict={dict} title={dict.access.ownerHome} />
      <main className="container-page space-y-6 py-8">
        {views.length === 0 ? (
          <EmptyState
            icon={Home}
            title={dict.access.ownerEmpty}
            description={dict.owner.subtitle}
          />
        ) : (
          views.map((view) => {
            const openCases = view.cases.filter((item) => !CLOSED_STATUSES.includes(item.status));
            return (
              <section
                key={view.property.id}
                className="space-y-4 rounded-3xl border border-border bg-white p-5 shadow-soft"
              >
                <header>
                  <h1 className="text-xl font-semibold text-navy-800">{view.property.name}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {view.property.address}, {view.property.city}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{dict.owner.privacy}</p>
                </header>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border px-4 py-3">
                    <p className="text-2xl font-semibold text-navy-800">{view.openCount}</p>
                    <p className="text-xs text-muted-foreground">{dict.owner.openWork}</p>
                  </div>
                  <div className="rounded-2xl border border-border px-4 py-3">
                    <p className="text-2xl font-semibold text-navy-800">{view.approvedCount}</p>
                    <p className="text-xs text-muted-foreground">{dict.owner.approvedWork}</p>
                  </div>
                  <div className="rounded-2xl border border-border px-4 py-3">
                    <p
                      className={`text-sm font-medium ${
                        view.property.guestReady ? "text-status-done" : "text-status-waiting"
                      }`}
                    >
                      {view.property.guestReady ? dict.owner.ready : dict.owner.notReady}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{dict.owner.cleaning}</p>
                  </div>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-navy-800">{dict.owner.work}</h2>
                  {view.cases.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">{dict.owner.noWork}</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {(openCases.length ? openCases : view.cases).map((item) => (
                        <li key={item.id} className="rounded-xl border border-border/80 px-3 py-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-navy-800">{item.title}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {formatDate(item.createdAt, locale)}
                              </p>
                            </div>
                            <StatusBadge status={item.status} dict={dict} />
                          </div>
                          {item.costEstimate != null ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {dict.owner.cost}: {item.costEstimate}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-navy-800">{dict.owner.cleaning}</h2>
                  {view.cleaning.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">{dict.owner.noCleaning}</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {view.cleaning.map((job) => (
                        <li key={job.id} className="flex items-center justify-between gap-3">
                          <p className="text-sm text-navy-700">{formatDate(job.scheduledAt, locale)}</p>
                          <CleaningStatusBadge status={job.status} dict={dict} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            );
          })
        )}
        <p className="sr-only">
          <Link href="/app/owner">{dict.access.ownerOpen}</Link>
        </p>
      </main>
    </div>
  );
}
