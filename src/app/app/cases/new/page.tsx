import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { FormField, NativeSelect } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { createManagerCaseAction } from "@/lib/actions";
import { getOrganization, getProfile, listProperties } from "@/lib/data/store";
import { categoryLabel, priorityLabel } from "@/lib/labels";
import { getSession } from "@/lib/session";
import { CASE_CATEGORIES, CASE_PRIORITIES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewCasePage({
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
  const properties = listProperties(session.organizationId);
  const sp = await searchParams;
  const propertyRaw = Array.isArray(sp.propertyId) ? sp.propertyId[0] : sp.propertyId;
  const selected =
    propertyRaw && properties.some((item) => item.id === propertyRaw) ? propertyRaw : properties[0]?.id;

  return (
    <div className="min-h-dvh bg-canvas">
      <AppHeader dict={dict} orgName={org?.name} current="cases" />
      <main className="container-page max-w-xl space-y-6 py-8">
        <div>
          <Link href="/app/cases" className="text-sm text-navy-700 hover:underline">
            {dict.dashboard.allCases}
          </Link>
          <PageHeader title={dict.dashboard.createCase} className="mt-3" />
        </div>
        {properties.length ? (
          <form action={createManagerCaseAction} className="space-y-5 rounded-2xl border border-border bg-white p-5 shadow-soft">
            <FormField label={dict.filters.property} htmlFor="propertyId" required>
              <NativeSelect id="propertyId" name="propertyId" required defaultValue={selected}>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label={dict.filters.category} htmlFor="category" required>
              <NativeSelect id="category" name="category" required defaultValue="other">
                {CASE_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {categoryLabel(dict, value)}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label={dict.filters.priority} htmlFor="priority" required>
              <NativeSelect id="priority" name="priority" required defaultValue="normal">
                {CASE_PRIORITIES.map((value) => (
                  <option key={value} value={value}>
                    {priorityLabel(dict, value)}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label={dict.report.heading} htmlFor="title" required>
              <Input id="title" name="title" required maxLength={200} />
            </FormField>
            <FormField label={dict.report.description} htmlFor="description" required>
              <Textarea id="description" name="description" required />
            </FormField>
            <Button type="submit" variant="cta">
              {dict.dashboard.createCase}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">{dict.homes.empty}</p>
        )}
      </main>
    </div>
  );
}
