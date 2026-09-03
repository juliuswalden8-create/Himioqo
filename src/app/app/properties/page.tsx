import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ReadyBadge } from "@/components/cleaning-status";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { HealthBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { interpolate } from "@/i18n/interpolate";
import { createPropertyAction } from "@/lib/guide-actions";
import {
  getGuideAnalytics,
  getOrganization,
  getProfile,
  listProperties,
  propertyFilterOptions,
} from "@/lib/data/store";
import { healthLabel } from "@/lib/labels";
import { getSession } from "@/lib/session";
import { PROPERTY_HEALTH, type PropertyHealth } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const profile = getProfile(session.profileId);
  const org = getOrganization(session.organizationId);
  const locale = await getLocale();
  const dict = await getDictionary(profile?.locale || locale);

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

  return (
    <div className="min-h-dvh bg-canvas">
      <AppHeader dict={dict} orgName={org?.name} current="homes" />
      <main className="container-page space-y-8 py-8">
        <PageHeader
          title={dict.homes.title}
          description={interpolate(dict.filters.results, {
            count: String(properties.length),
          })}
        />

        <FilterBar
          action="/app/properties"
          searchLabel={dict.filters.search}
          searchPlaceholder={dict.filters.searchProperties}
          searchValue={query}
          applyLabel={dict.filters.apply}
          clearLabel={dict.filters.clear}
          hasFilters={hasFilters}
          selects={[
            {
              name: "city",
              label: dict.filters.property,
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

        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          {properties.length ? (
            <ul className="divide-y divide-border">
              {properties.map((property) => {
                const stats = getGuideAnalytics(session.organizationId, property.id);
                return (
                  <li key={property.id}>
                    <Link
                      href={`/app/properties/${property.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-navy-800">{property.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {property.city} · {stats.scans} {dict.homes.scans.toLowerCase()} · {stats.clicks}{" "}
                          {dict.homes.clicks.toLowerCase()}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {property.guestReady ? (
                          <ReadyBadge label={dict.dashboard.ready} />
                        ) : null}
                        <HealthBadge health={property.health} dict={dict} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {hasFilters ? dict.filters.noResults : dict.homes.empty}
            </p>
          )}
        </section>
        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.homes.newHome}</h2>
          <form action={createPropertyAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">{dict.propertyForm.name}</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="address">{dict.propertyForm.address}</Label>
              <Input id="address" name="address" required />
            </div>
            <div>
              <Label htmlFor="city">{dict.propertyForm.city}</Label>
              <Input id="city" name="city" required />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="tenantName">{dict.propertyForm.tenant}</Label>
              <Input id="tenantName" name="tenantName" required />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">{dict.homes.newHome}</Button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
