import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AppListRow } from "@/components/app-list-row";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/page-metadata";
import { getOrganization, listCases, listProperties } from "@/lib/data/store";
import { formatDate, formatOpenDuration, formatRelative } from "@/lib/format";
import { caseIsOpen, caseIsOverdue } from "@/lib/ops-attention";
import { interpolate } from "@/i18n/interpolate";
import { categoryLabel, priorityLabel, statusLabel } from "@/lib/labels";
import { getSession } from "@/lib/session";
import {
  CASE_CATEGORIES,
  CASE_PRIORITIES,
  CASE_SORTS,
  CASE_STATUSES,
  type CaseCategory,
  type CasePriority,
  type CaseSort,
  type CaseStatus,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.nav.cases);
}

/** Narrows a raw query string value to a known enum member, or "all". */
function pick<T extends string>(value: string | undefined, allowed: readonly T[]): T | "all" {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : "all";
}

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const org = getOrganization(session.organizationId);
  const locale = await getLocale();
  const viewerLocale = locale;
  const dict = await getDictionary(viewerLocale);

  const sp = await searchParams;
  const one = (key: string) => (Array.isArray(sp[key]) ? sp[key][0] : sp[key]) ?? undefined;

  const properties = listProperties(session.organizationId);
  const query = (one("q") ?? "").slice(0, 100);
  const status = pick<CaseStatus>(one("status"), CASE_STATUSES);
  const priority = pick<CasePriority>(one("priority"), CASE_PRIORITIES);
  const category = pick<CaseCategory>(one("category"), CASE_CATEGORIES);
  const sortRaw = one("sort");
  const sort: CaseSort =
    sortRaw && (CASE_SORTS as readonly string[]).includes(sortRaw) ? (sortRaw as CaseSort) : "date";
  const propertyRaw = one("propertyId");
  const propertyId =
    propertyRaw && properties.some((p) => p.id === propertyRaw) ? propertyRaw : "all";

  const cases = listCases(session.organizationId, {
    query: query || undefined,
    status,
    priority,
    category,
    propertyId,
    sort,
  });

  const hasFilters =
    Boolean(query) ||
    status !== "all" ||
    priority !== "all" ||
    category !== "all" ||
    propertyId !== "all" ||
    sort !== "date";

  const allOption = { value: "all", label: dict.filters.all };

  return (
    <div className="min-h-dvh bg-canvas">
      <AppHeader dict={dict} orgName={org?.name} current="cases" />
      <main className="container-page space-y-6 py-8">
        <PageHeader
          title={dict.dashboard.allCases}
          description={interpolate(dict.filters.results, { count: String(cases.length) })}
          actions={
            <Button asChild variant="cta">
              <Link href="/app/cases/new">{dict.dashboard.createCase}</Link>
            </Button>
          }
        />

        <FilterBar
          action="/app/cases"
          searchLabel={dict.filters.search}
          searchPlaceholder={dict.filters.searchCases}
          searchValue={query}
          clearLabel={dict.filters.clear}
          hasFilters={hasFilters}
          selects={[
            {
              name: "status",
              label: dict.filters.status,
              value: status,
              options: [
                allOption,
                ...CASE_STATUSES.map((value) => ({
                  value,
                  label: statusLabel(dict, value),
                })),
              ],
            },
            {
              name: "priority",
              label: dict.filters.priority,
              value: priority,
              options: [
                allOption,
                ...CASE_PRIORITIES.map((value) => ({
                  value,
                  label: priorityLabel(dict, value),
                })),
              ],
            },
            {
              name: "propertyId",
              label: dict.filters.property,
              value: propertyId,
              options: [
                allOption,
                ...properties.map((p) => ({ value: p.id, label: p.name })),
              ],
            },
            {
              name: "category",
              label: dict.filters.category,
              value: category,
              options: [
                allOption,
                ...CASE_CATEGORIES.map((value) => ({
                  value,
                  label: categoryLabel(dict, value),
                })),
              ],
            },
            {
              name: "sort",
              label: dict.filters.sort,
              value: sort,
              options: [
                { value: "date", label: dict.filters.sortDate },
                { value: "priority", label: dict.filters.sortPriority },
                { value: "status", label: dict.filters.sortStatus },
              ],
            },
          ]}
        />

        <section className="rounded-2xl border border-border bg-white px-5 shadow-soft">
          {cases.length ? (
            <ul>
              {cases.map((item) => {
                const latest = item.activity[0];
                const open = caseIsOpen(item.status);
                const unassigned = open && !item.contractorId;
                return (
                  <AppListRow
                    key={item.id}
                    href={`/app/cases/${item.id}`}
                    badges={
                      <>
                        {caseIsOverdue(item) ? (
                          <span className="inline-flex items-center rounded-full bg-status-urgent/10 px-2.5 py-1 text-xs font-medium text-status-urgent">
                            {dict.dashboard.attentionOverdue}
                          </span>
                        ) : null}
                        <PriorityBadge priority={item.priority} dict={dict} />
                        <StatusBadge status={item.status} dict={dict} />
                      </>
                    }
                    actions={
                      unassigned ? (
                        <Button asChild size="sm" variant="cta">
                          <Link href={`/app/cases/${item.id}#assign`}>{dict.dashboard.assign}</Link>
                        </Button>
                      ) : null
                    }
                  >
                    <p className="truncate text-sm font-medium text-navy-800">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.reference} · {item.property.name} ·{" "}
                      {formatDate(item.createdAt, viewerLocale)}
                    </p>
                    {open ? (
                      <p className="text-xs text-muted-foreground">
                        {interpolate(dict.dashboard.openFor, {
                          duration: formatOpenDuration(item.createdAt, viewerLocale),
                        })}
                      </p>
                    ) : null}
                    {unassigned ? (
                      <p className="mt-0.5 text-xs font-medium text-status-urgent">
                        {dict.dashboard.unassigned}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">{item.contractor?.name}</p>
                    )}
                    {latest ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {dict.dashboard.lastActivity}: {latest.text} ·{" "}
                        {formatRelative(latest.createdAt, viewerLocale)}
                      </p>
                    ) : null}
                  </AppListRow>
                );
              })}
            </ul>
          ) : (
            <p className="py-5 text-sm text-muted-foreground">
              {hasFilters ? dict.filters.noResults : dict.dashboard.emptyCases}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
