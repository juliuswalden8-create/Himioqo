import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { GdprActions } from "@/components/gdpr-actions";
import { PageHeader } from "@/components/page-header";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { getOrganization, getProfile } from "@/lib/data/store";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const profile = getProfile(session.profileId);
  const org = getOrganization(session.organizationId);
  const locale = await getLocale();
  const dict = await getDictionary(profile?.locale || locale);

  return (
    <div className="min-h-dvh bg-canvas">
      <AppHeader dict={dict} orgName={org?.name} current="settings" />
      <main className="container-page max-w-xl space-y-8 py-8">
        <PageHeader title={dict.settings.title} />
        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.settings.gdpr}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile?.email} · {profile?.fullName}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{dict.settings.marketing}: {profile?.marketingConsent ? "Ja" : "Nej"}</p>
          <div className="mt-4">
            <GdprActions dict={dict} />
          </div>
        </section>
      </main>
    </div>
  );
}
