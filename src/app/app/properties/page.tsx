import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { AppListRow } from "@/components/app-list-row";
import { ReadyBadge } from "@/components/cleaning-status";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { PropertyRowMenu } from "@/components/property-row-menu";
import { HealthBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { FormField, NativeSelect } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/page-metadata";
import { interpolate } from "@/i18n/interpolate";
import { createPropertyAction } from "@/lib/guide-actions";
import { SUPPORT_EMAIL } from "@/lib/constants";
import {
  canAddProperty,
  getOrganization,
  getPropertyGuide,
  getPropertyTraffic,
  listProperties,
  propertyFilterOptions,
} from "@/lib/data/store";
import { formatDate } from "@/lib/format";
import { healthLabel, propertyTypeLabel } from "@/lib/labels";
import { requireHostSession } from "@/lib/session";
import { PROPERTY_HEALTH, PROPERTY_TYPES, type PropertyHealth } from "@/lib/types";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.homes.title);
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireHostSession();
  const org = getOrganization(session.organizationId);
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  const sp = await searchParams;
  const one = (key: string) => (Array.isArray(sp[key]) ? sp[key][0] : sp[key]) ?? undefined;

  const options = propertyFilterOptions(session.organizationId);
  const query = (one("q") ?? "").slice(0, 100);
  const cityRaw = one("city");
  const city = cityRaw && options.cities.includes(cityRaw) ? cityRaw : "all";
  const healthRaw = one("health");
  const health = healthRaw && PROPERTY_HEALTH.includes(healthRaw as PropertyHealth)
    ? (healthRaw as PropertyHealth)
    : "all";

  const properties = listProperties(session.organizationId, {
    query: query || undefined,
    city,
    health,
  });
  const hasFilters = Boolean(query) || city !== "all" || health !== "all";
  const allOption = { value: "all", label: dict.filters.all };
  const atLimit = !canAddProperty(session.organizationId);
  const limitHit = one("limit") === "1" || atLimit;

  return (
    <div className="min-h-dvh bg-canvas">
      <AppHeader dict={dict} orgName={org?.name} current="homes" />
      <main className="container-page space-y-8 py-8">
        <PageHeader
          title={dict.homes.title}
          description={interpolate(dict.filters.results, {
            count: String(properties.length),
          })}
          actions={
            atLimit ? null : (
              <Button asChild variant="cta">
                <a href="#create">{dict.homes.addHome}</a>
              </Button>
            )
          }
        />

        <FilterBar
          action="/app/properties"
          searchLabel={dict.filters.search}
          searchPlaceholder={dict.filters.searchProperties}
          searchValue={query}
          clearLabel={dict.filters.clear}
          hasFilters={hasFilters}
          columnsClassName="lg:grid-cols-3"
          selects={[
            {
              name: "city",
              label: dict.filters.area,
              value: city,
              options: [
                allOption,
                ...options.cities.map((value) => ({ value, label: value })),
              ],
            },
            {
              name: "health",
              label: dict.filters.health,
              value: health,
              options: [
                allOption,
                ...PROPERTY_HEALTH.map((value) => ({
                  value,
                  label: healthLabel(dict, value),
                })),
              ],
            },
          ]}
        />

        <section className="rounded-2xl border border-border bg-white px-5 shadow-soft">
          {properties.length ? (
            <ul>
              {properties.map((property) => {
                const traffic = getPropertyTraffic(session.organizationId, property.id);
                const guide = getPropertyGuide(property.id);
                const nextCheckIn = property.nextCheckoutAt
                  ? interpolate(dict.homes.nextCheckIn, {
                      when: `${formatDate(property.nextCheckoutAt, locale)}${guide?.checkIn ? ` · ${guide.checkIn}` : ""}`,
                    })
                  : dict.homes.nextCheckInNone;
                return (
                  <AppListRow
                    key={property.id}
                    href={`/app/properties/${property.id}`}
                    fullRow
                    rowLabel={property.name}
                    badges={
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {dict.dashboard.opsStatus}
                          </span>
                          <HealthBadge health={property.health} dict={dict} />
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {dict.dashboard.cleanStatus}
                          </span>
                          {property.guestReady ? (
                            <ReadyBadge label={dict.dashboard.ready} />
                          ) : (
                            <span className="text-xs text-muted-foreground">{dict.dashboard.notReady}</span>
                          )}
                        </div>
                      </div>
                    }
                    actions={
                      <>
                        <Button asChild size="sm">
                          <Link href={`/app/properties/${property.id}`}>{dict.homes.openHome}</Link>
                        </Button>
                        <PropertyRowMenu
                          label={dict.homes.moreActions}
                          qrLabel={dict.dashboard.showQr}
                          qrHref={`/app/properties/${property.id}?tab=qr`}
                          guideLabel={dict.homes.editGuide}
                          guideHref={`/app/properties/${property.id}?tab=info`}
                          caseLabel={dict.homes.createCase}
                          caseHref={`/app/cases/new?propertyId=${property.id}`}
                        />
                      </>
                    }
                  >
                    <p className="truncate text-sm font-medium text-navy-800">{property.name}</p>
                    <p className="text-xs text-muted-foreground">{nextCheckIn}</p>
                    <p className="text-xs text-muted-foreground">
                      {interpolate(dict.homes.openCasesCount, {
                        count: String(property.openCaseCount),
                      })}
                      {" · "}
                      {property.city}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {interpolate(dict.homes.scans30, { count: String(traffic.scans) })}
                    </p>
                  </AppListRow>
                );
              })}
            </ul>
          ) : (
            <p className="py-5 text-sm text-muted-foreground">
              {hasFilters ? dict.filters.noResults : dict.homes.empty}
            </p>
          )}
        </section>
        <section
          id="create"
          className="scroll-mt-24 rounded-2xl border border-border bg-white p-5 shadow-soft"
        >
          <h2 className="text-sm font-semibold text-navy-800">{dict.homes.newHome}</h2>
          {limitHit ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-navy-800">{dict.homes.limitTitle}</p>
              <p className="text-sm text-muted-foreground">{dict.homes.limitHelp}</p>
              <Button asChild variant="cta">
                <a href={`mailto:${SUPPORT_EMAIL}`}>{dict.homes.limitCta}</a>
              </Button>
            </div>
          ) : (
          <form action={createPropertyAction} className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <FormField label={dict.propertyForm.name} htmlFor="name" required className="sm:col-span-2">
              <Input id="name" name="name" required />
            </FormField>
            <FormField label={dict.propertyForm.address} htmlFor="address" required>
              <Input id="address" name="address" required />
            </FormField>
            <FormField label={dict.propertyForm.city} htmlFor="city" required>
              <Input id="city" name="city" required />
            </FormField>
            <FormField label={dict.propertyForm.type} htmlFor="type">
              <NativeSelect id="type" name="type" defaultValue="apartment">
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {propertyTypeLabel(dict, type)}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField
              label={dict.propertyForm.tenant}
              htmlFor="tenantName"
              hint={dict.propertyForm.tenantHelp}
            >
              <Input
                id="tenantName"
                name="tenantName"
                placeholder={dict.propertyForm.tenantDefault}
              />
            </FormField>
            <FormField
              label={dict.propertyForm.notes}
              htmlFor="notes"
              hint={dict.propertyForm.notesHelp}
              className="sm:col-span-2"
            >
              <Textarea id="notes" name="notes" />
            </FormField>
            <div className="sm:col-span-2">
              <Button type="submit" variant="cta">
                {dict.homes.addHome}
              </Button>
            </div>
          </form>
          )}
        </section>
      </main>
    </div>
  );
}
