import { AppHeader } from "@/components/app-header";
import { DangerZone } from "@/components/danger-zone";
import { ExportDataButton } from "@/components/export-data-button";
import { InvitePanel } from "@/components/invite-panel";
import { PageHeader } from "@/components/page-header";
import { SettingsBilling } from "@/components/settings-billing";
import { SettingsLanguage } from "@/components/settings-language";
import { Button } from "@/components/ui/button";
import { FormField, NativeCheckbox } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/page-metadata";
import { updateNotificationSettingsAction, updateSettingsAction } from "@/lib/actions";
import { SUPPORT_EMAIL } from "@/lib/constants";
import {
  getOrganization,
  getProfile,
  isTrialEnded,
  listInvitations,
  listProperties,
  trialDaysLeft,
} from "@/lib/data/store";
import { requireHostSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata((dict) => dict.settings.title);
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireHostSession();
  const profile = getProfile(session.profileId);
  const org = getOrganization(session.organizationId);
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const sp = await searchParams;
  const saved = (Array.isArray(sp.saved) ? sp.saved[0] : sp.saved) === "1";
  const days = trialDaysLeft(session.organizationId);
  const ended = isTrialEnded(session.organizationId);
  const properties = listProperties(session.organizationId);
  const invitations = listInvitations(session.organizationId);

  return (
    <div className="min-h-dvh bg-canvas">
      <AppHeader dict={dict} orgName={org?.name} current="settings" />
      <main className="container-page max-w-xl space-y-8 py-8">
        <PageHeader title={dict.settings.title} />
        {saved ? <p className="text-sm text-green-700">{dict.settings.saved}</p> : null}

        <section className="space-y-5 rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.settings.company}</h2>
          <form action={updateSettingsAction} className="space-y-5">
            <FormField label={dict.settings.companyName} htmlFor="organizationName" required>
              <Input
                id="organizationName"
                name="organizationName"
                required
                defaultValue={org?.name ?? ""}
              />
            </FormField>
            <FormField label={dict.settings.supportEmail} htmlFor="supportEmail">
              <Input
                id="supportEmail"
                name="supportEmail"
                type="email"
                defaultValue={org?.supportEmail ?? ""}
              />
            </FormField>
            <FormField label={dict.settings.supportPhone} htmlFor="supportPhone">
              <Input id="supportPhone" name="supportPhone" defaultValue={org?.supportPhone ?? ""} />
            </FormField>
            <FormField label={dict.settings.emergencyPhone} htmlFor="emergencyPhone">
              <Input
                id="emergencyPhone"
                name="emergencyPhone"
                defaultValue={org?.emergencyPhone ?? ""}
              />
            </FormField>
            <FormField label={dict.settings.yourName} htmlFor="fullName" required>
              <Input id="fullName" name="fullName" required defaultValue={profile?.fullName ?? ""} />
            </FormField>
            <FormField label={dict.settings.yourEmail} htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={profile?.email ?? ""}
              />
            </FormField>
            <FormField label={dict.settings.yourPhone} htmlFor="phone">
              <Input id="phone" name="phone" defaultValue={profile?.phone ?? ""} />
            </FormField>
            <Button type="submit">{dict.settings.save}</Button>
          </form>
        </section>

        <SettingsBilling dict={dict} org={org} days={days} trialEnded={ended} saved={saved} />

        <section
          id="users"
          className="scroll-mt-24 space-y-3 rounded-2xl border border-border bg-white p-5 shadow-soft"
        >
          <h2 className="text-sm font-semibold text-navy-800">{dict.settings.users}</h2>
          <p className="text-sm text-muted-foreground">{dict.settings.usersHelp}</p>
          <div className="rounded-xl border border-border px-3 py-3">
            <p className="text-sm font-medium text-navy-800">{profile?.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {profile?.email} · {dict.access.roles[session.role]}
            </p>
          </div>
          <h3 className="pt-2 text-sm font-semibold text-navy-800">{dict.settings.invite}</h3>
          <p className="text-sm text-muted-foreground">{dict.settings.inviteHelp}</p>
          <InvitePanel
            dict={dict}
            properties={properties.map((item) => ({ id: item.id, name: item.name }))}
            invitations={invitations}
          />
        </section>

        <section className="space-y-5 rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.settings.notifications}</h2>
          <form action={updateNotificationSettingsAction} className="space-y-4">
            <label className="flex items-start gap-3 text-sm text-navy-800">
              <NativeCheckbox
                name="notifyCases"
                defaultChecked={profile?.notifyCases !== false}
                className="mt-0.5"
              />
              <span>{dict.settings.notifyCases}</span>
            </label>
            <label className="flex items-start gap-3 text-sm text-navy-800">
              <NativeCheckbox
                name="notifyCleaning"
                defaultChecked={profile?.notifyCleaning !== false}
                className="mt-0.5"
              />
              <span>{dict.settings.notifyCleaning}</span>
            </label>
            <label className="flex items-start gap-3 text-sm text-navy-800">
              <NativeCheckbox
                name="notifyUrgent"
                defaultChecked={profile?.notifyUrgent !== false}
                className="mt-0.5"
              />
              <span>{dict.settings.notifyUrgent}</span>
            </label>
            <label className="flex items-start gap-3 text-sm text-navy-800">
              <NativeCheckbox
                name="marketingConsent"
                defaultChecked={Boolean(profile?.marketingConsent)}
                className="mt-0.5"
              />
              <span>{dict.settings.marketing}</span>
            </label>
            <Button type="submit" variant="secondary">
              {dict.settings.save}
            </Button>
          </form>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.settings.language}</h2>
          <p className="text-sm text-muted-foreground">{dict.settings.languageHelp}</p>
          <SettingsLanguage value={profile?.locale || locale} dict={dict} />
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.settings.support}</h2>
          <p className="text-sm text-muted-foreground">{dict.settings.supportHelp}</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm font-medium text-navy-700 underline">
            {SUPPORT_EMAIL}
          </a>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-navy-800">{dict.settings.exportTitle}</h2>
          <p className="text-sm text-muted-foreground">{dict.settings.exportHelp}</p>
          <ExportDataButton dict={dict} />
        </section>

        <section className="space-y-3 rounded-2xl border border-destructive/30 bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-destructive">{dict.settings.danger}</h2>
          <p className="text-sm text-muted-foreground">{dict.settings.dangerHelp}</p>
          <DangerZone dict={dict} />
        </section>
      </main>
    </div>
  );
}
