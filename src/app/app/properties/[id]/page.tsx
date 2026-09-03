import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { FormField, NativeCheckbox, NativeSelect } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import {
  assignPlaceAction,
  copyPlacesAction,
  createPlaceAction,
  moveCategoryAction,
  movePlaceAction,
  rotatePropertyTokenAction,
  saveGuideAction,
  savePlaceAction,
  savePropertyBasicsAction,
  togglePlaceAction,
} from "@/lib/guide-actions";
import { rotateOwnerAccessAction, toggleOwnerAccessAction } from "@/lib/owner-actions";
import { OwnerAccessForm } from "@/components/property/owner-access-form";
import { QrPanel } from "@/components/property/qr-panel";
import {
  getGuideAnalytics,
  getOrganization,
  getProfile,
  getProperty,
  getPropertyGuide,
  listAssignedPlaces,
  listOwnerAccess,
  listPlaces,
  listProperties,
} from "@/lib/data/store";
import { PLACE_CATEGORIES, type MonetizationKind } from "@/lib/types";
import { getSession } from "@/lib/session";
import { appUrl, cn } from "@/lib/utils";
import { pickText } from "@/lib/places";

export const dynamic = "force-dynamic";

export default async function PropertyAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; saved?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const { tab: tabRaw, saved } = await searchParams;
  const property = getProperty(session.organizationId, id);
  if (!property) notFound();
  const profile = getProfile(session.profileId);
  const org = getOrganization(session.organizationId);
  const locale = await getLocale();
  const dict = await getDictionary(profile?.locale || locale);
  const guide = getPropertyGuide(property.id);
  const assigned = listAssignedPlaces(property.id);
  const partners = listPlaces(session.organizationId);
  const others = listProperties(session.organizationId).filter((item) => item.id !== property.id);
  const stats = getGuideAnalytics(session.organizationId, property.id);
  const ownerLinks = listOwnerAccess(session.organizationId, property.id);
  const tab = ["info", "places", "qr", "owner", "analytics"].includes(tabRaw ?? "")
    ? (tabRaw as "info" | "places" | "qr" | "owner" | "analytics")
    : "info";
  const tabs = [
    { id: "info" as const, label: dict.homes.editInfo },
    { id: "places" as const, label: dict.homes.places },
    { id: "qr" as const, label: dict.homes.qr },
    { id: "owner" as const, label: dict.owner.access },
    { id: "analytics" as const, label: dict.homes.analytics },
  ];
  const numbersText =
    guide?.importantNumbers
      .map((item) => `${pickText(item.label, "sv") || pickText(item.label, "en")}|${item.phone}`)
      .join("\n") ?? "Nödsamtal|112";
  const applianceValue = (key: string, lang: "sv" | "en") =>
    pickText(guide?.appliances.find((item) => item.key === key)?.text, lang);

  return (
    <div className="min-h-dvh bg-canvas">
      <AppHeader dict={dict} orgName={org?.name} current="homes" />
      <main className="container-page space-y-6 py-8">
        <PageHeader
          title={property.name}
          description={`${property.address}, ${property.city}`}
          actions={
            <>
              <Button asChild variant="cta">
                <Link href={`/qr/${property.reportToken}`}>{dict.dashboard.showQr}</Link>
              </Button>
              <Button asChild>
                <a href={`/g/${property.reportToken}`} target="_blank" rel="noreferrer">
                  {dict.homes.openGuide}
                </a>
              </Button>
            </>
          }
        />
        {saved ? <p className="text-sm text-green-700">{dict.homes.saved}</p> : null}
        <nav className="flex gap-2 overflow-x-auto">
          {tabs.map((item) => (
            <Link
              key={item.id}
              href={`/app/properties/${property.id}?tab=${item.id}`}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm",
                tab === item.id ? "bg-navy-800 text-white" : "bg-white text-navy-800 border border-border",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {tab === "info" && guide ? (
          <div className="space-y-6">
            <form action={savePropertyBasicsAction} className="rounded-2xl border border-border bg-white p-5 shadow-soft">
              <input type="hidden" name="propertyId" value={property.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={dict.homes.name} name="name" defaultValue={property.name} />
                <Field label={dict.homes.address} name="address" defaultValue={property.address} />
                <Field label={dict.propertyForm.city} name="city" defaultValue={property.city} />
                <Field label={dict.homes.lat} name="lat" defaultValue={property.lat?.toString() ?? ""} />
                <Field label={dict.homes.lng} name="lng" defaultValue={property.lng?.toString() ?? ""} />
              </div>
              <Button type="submit" className="mt-4">
                {dict.homes.save}
              </Button>
            </form>
            <form action={saveGuideAction} className="space-y-5 rounded-2xl border border-border bg-white p-5 shadow-soft">
              <input type="hidden" name="propertyId" value={property.id} />
              <Bilingual
                label={dict.homes.welcome}
                name="welcome"
                sv={guide.welcome.sv ?? ""}
                en={guide.welcome.en ?? ""}
                dict={dict}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={dict.homes.wifiName} name="wifiName" defaultValue={guide.wifiName} />
                <Field label={dict.homes.wifiPassword} name="wifiPassword" defaultValue={guide.wifiPassword} />
                <Field label={dict.homes.checkIn} name="checkIn" defaultValue={guide.checkIn} />
                <Field label={dict.homes.checkOut} name="checkOut" defaultValue={guide.checkOut} />
              </div>
              <Bilingual label={dict.homes.rules} name="rules" sv={guide.houseRules.sv ?? ""} en={guide.houseRules.en ?? ""} dict={dict} area />
              <Bilingual label={dict.homes.parking} name="parking" sv={guide.parking.sv ?? ""} en={guide.parking.en ?? ""} dict={dict} area />
              <Bilingual label={dict.homes.waste} name="waste" sv={guide.waste.sv ?? ""} en={guide.waste.en ?? ""} dict={dict} area />
              <Bilingual label={dict.homes.emergency} name="emergency" sv={guide.emergency.sv ?? ""} en={guide.emergency.en ?? ""} dict={dict} area />
              <div>
                <Label>{dict.homes.numbers}</Label>
                <Textarea name="numbers" defaultValue={numbersText} className="mt-1" />
                <p className="mt-1 text-xs text-muted-foreground">Namn|telefon</p>
              </div>
              {(["ac", "washer", "dishwasher", "pool", "other"] as const).map((key) => (
                <Bilingual
                  key={key}
                  label={dict.guide.appliance[key]}
                  name={`appliance_${key}`}
                  sv={applianceValue(key, "sv")}
                  en={applianceValue(key, "en")}
                  dict={dict}
                  area
                />
              ))}
              <Button type="submit">{dict.homes.save}</Button>
            </form>
            <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
              <h2 className="text-sm font-semibold text-navy-800">{dict.homes.order}</h2>
              <ul className="mt-3 divide-y divide-border">
                {guide.categoryOrder.map((category, index) => (
                  <li key={category} className="flex items-center justify-between gap-3 py-2">
                    <p className="text-sm text-navy-800">{dict.guide.categories[category]}</p>
                    <div className="flex gap-1">
                      <MoveForm
                        action={moveCategoryAction}
                        propertyId={property.id}
                        extra={{ category }}
                        direction={-1}
                        disabled={index === 0}
                      />
                      <MoveForm
                        action={moveCategoryAction}
                        propertyId={property.id}
                        extra={{ category }}
                        direction={1}
                        disabled={index === guide.categoryOrder.length - 1}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}

        {tab === "places" ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
              <h2 className="text-sm font-semibold text-navy-800">{dict.homes.places}</h2>
              <ul className="mt-3 divide-y divide-border">
                {assigned.map((item, index) => (
                  <li key={item.id} className="space-y-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-navy-800">
                          {item.place.name}
                          {item.place.sponsored ? (
                            <span className="ml-2 rounded-full bg-navy-50 px-2 py-0.5 text-[11px]">
                              {dict.guide.sponsored}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dict.guide.categories[item.place.category]}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <MoveForm
                          action={movePlaceAction}
                          propertyId={property.id}
                          extra={{ propertyPlaceId: item.id }}
                          direction={-1}
                          disabled={index === 0}
                        />
                        <MoveForm
                          action={movePlaceAction}
                          propertyId={property.id}
                          extra={{ propertyPlaceId: item.id }}
                          direction={1}
                          disabled={index === assigned.length - 1}
                        />
                      </div>
                    </div>
                    <form action={togglePlaceAction} className="flex items-center gap-2">
                      <input type="hidden" name="propertyPlaceId" value={item.id} />
                      <input type="hidden" name="enabled" value={item.enabled ? "false" : "true"} />
                      <Button type="submit" size="sm" variant={item.enabled ? "secondary" : "default"}>
                        {item.enabled ? dict.homes.hide : dict.homes.show}
                      </Button>
                    </form>
                    <form action={savePlaceAction} className="grid gap-2 sm:grid-cols-2">
                      <input type="hidden" name="placeId" value={item.place.id} />
                      <Field label={dict.homes.name} name="name" defaultValue={item.place.name} />
                      <Field label={dict.homes.hours} name="hours" defaultValue={item.place.hours ?? ""} />
                      <Field label={dict.homes.phone} name="phone" defaultValue={item.place.phone ?? ""} />
                      <Field label={dict.homes.whatsapp} name="whatsapp" defaultValue={item.place.whatsapp ?? ""} />
                      <Field label={dict.homes.website} name="website" defaultValue={item.place.website ?? ""} />
                      <Field label={dict.homes.booking} name="bookingUrl" defaultValue={item.place.bookingUrl ?? ""} />
                      <Field
                        label={dict.homes.discountCode}
                        name="discountCode"
                        defaultValue={item.place.discountCode ?? ""}
                      />
                      <Field
                        label={dict.homes.trackingCode}
                        name="trackingCode"
                        defaultValue={item.place.monetization.trackingCode ?? ""}
                      />
                      <label className="flex items-center gap-3 text-[15px] text-ocean">
                        <NativeCheckbox
                          name="sponsored"
                          defaultChecked={item.place.sponsored}
                        />
                        {dict.homes.sponsored}
                      </label>
                      <FormField label={dict.homes.monetization} htmlFor={`monetization-${item.id}`}>
                        <NativeSelect
                          id={`monetization-${item.id}`}
                          name="monetization"
                          defaultValue={item.place.monetization.kind}
                        >
                          {(Object.keys(dict.homes.monetizationKinds) as MonetizationKind[]).map((kind) => (
                            <option key={kind} value={kind}>
                              {dict.homes.monetizationKinds[kind]}
                            </option>
                          ))}
                        </NativeSelect>
                      </FormField>
                      <div className="sm:col-span-2">
                        <Button type="submit" size="sm">
                          {dict.homes.save}
                        </Button>
                      </div>
                    </form>
                  </li>
                ))}
              </ul>
            </section>

            {others.length ? (
              <form action={copyPlacesAction} className="rounded-2xl border border-border bg-white p-5 shadow-soft">
                <h2 className="text-sm font-semibold text-navy-800">{dict.homes.copyFrom}</h2>
                <input type="hidden" name="propertyId" value={property.id} />
                <NativeSelect name="fromPropertyId" className="mt-3">
                  {others.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </NativeSelect>
                <Button type="submit" className="mt-3">
                  {dict.homes.copy}
                </Button>
              </form>
            ) : null}

            <form action={assignPlaceAction} className="rounded-2xl border border-border bg-white p-5 shadow-soft">
              <h2 className="text-sm font-semibold text-navy-800">{dict.homes.assignExisting}</h2>
              <input type="hidden" name="propertyId" value={property.id} />
              <NativeSelect name="placeId" className="mt-3">
                {partners.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </NativeSelect>
              <Button type="submit" className="mt-3" disabled={!partners.length}>
                {dict.homes.assignExisting}
              </Button>
            </form>

            <form action={createPlaceAction} className="space-y-5 rounded-2xl border border-border bg-white p-5 shadow-soft">
              <h2 className="text-sm font-semibold text-navy-800">{dict.homes.addPlace}</h2>
              <input type="hidden" name="propertyId" value={property.id} />
              <FormField label={dict.homes.category} htmlFor="place-category">
                <NativeSelect id="place-category" name="category">
                  {PLACE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {dict.guide.categories[category]}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <Field label={dict.homes.name} name="name" required />
              <Bilingual label={dict.homes.description} name="description" sv="" en="" dict={dict} area />
              <Field label={dict.homes.image} name="imageUrl" />
              <Field label={dict.homes.address} name="address" />
              <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <Field label={dict.homes.lat} name="lat" />
                <Field label={dict.homes.lng} name="lng" />
                <Field label={dict.homes.hours} name="hours" />
                <Field label={dict.homes.phone} name="phone" />
                <Field label={dict.homes.whatsapp} name="whatsapp" />
                <Field label={dict.homes.website} name="website" />
                <Field label={dict.homes.booking} name="bookingUrl" />
                <Field label={dict.homes.discountCode} name="discountCode" />
                <Field label={dict.homes.trackingCode} name="trackingCode" />
              </div>
              <Bilingual label={dict.homes.discountLabel} name="discountLabel" sv="" en="" dict={dict} />
              <label className="flex items-center gap-3 text-[15px] text-ocean">
                <NativeCheckbox name="sponsored" />
                {dict.homes.sponsored}
              </label>
              <FormField label={dict.homes.monetization} htmlFor="place-monetization">
                <NativeSelect id="place-monetization" name="monetization">
                  {(Object.keys(dict.homes.monetizationKinds) as MonetizationKind[]).map((kind) => (
                    <option key={kind} value={kind}>
                      {dict.homes.monetizationKinds[kind]}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <Button type="submit">{dict.homes.addPlace}</Button>
            </form>
          </div>
        ) : null}

        {tab === "qr" ? (
          <section className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-soft">
            <div>
              <h2 className="text-sm font-semibold text-navy-800">{dict.homes.qr}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{dict.homes.qrHelp}</p>
            </div>
            <QrPanel
              guestUrl={appUrl(`/g/${property.reportToken}`)}
              downloadUrl={`/api/qr/${property.reportToken}`}
              previewUrl={`/qr/${property.reportToken}`}
              dict={dict}
            />
            <form
              action={rotatePropertyTokenAction}
              className="border-t border-border pt-4"
            >
              <input type="hidden" name="propertyId" value={property.id} />
              <p className="text-xs text-muted-foreground">{dict.homes.rotateHelp}</p>
              <Button type="submit" variant="secondary" className="mt-2">
                {dict.homes.rotate}
              </Button>
            </form>
          </section>
        ) : null}

        {tab === "owner" ? (
          <section className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-soft">
            <div>
              <h2 className="text-sm font-semibold text-navy-800">{dict.owner.access}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{dict.owner.accessHelp}</p>
            </div>

            {ownerLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">{dict.owner.noAccess}</p>
            ) : (
              <ul className="space-y-3">
                {ownerLinks.map((entry) => (
                  <li key={entry.id} className="rounded-xl border border-border/80 px-3 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-800">{entry.ownerName}</p>
                        <p className="text-xs text-muted-foreground">{entry.ownerEmail}</p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          entry.active
                            ? "bg-status-done/10 text-status-done"
                            : "bg-navy-50 text-navy-500",
                        )}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {entry.active ? dict.owner.active : dict.owner.revoked}
                      </span>
                    </div>
                    {entry.active ? (
                      <p className="mt-2 overflow-x-auto rounded-lg bg-canvas px-3 py-2 font-mono text-xs text-navy-700">
                        {appUrl(`/o/${entry.token}`)}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-3">
                      <form action={toggleOwnerAccessAction}>
                        <input type="hidden" name="id" value={entry.id} />
                        <input type="hidden" name="active" value={entry.active ? "0" : "1"} />
                        <button
                          type="submit"
                          className="text-sm font-medium text-navy-700 underline"
                        >
                          {entry.active ? dict.owner.revoke : dict.owner.reactivate}
                        </button>
                      </form>
                      <form action={rotateOwnerAccessAction}>
                        <input type="hidden" name="id" value={entry.id} />
                        <button
                          type="submit"
                          className="text-sm font-medium text-navy-700 underline"
                        >
                          {dict.owner.rotateLink}
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <OwnerAccessForm propertyId={property.id} dict={dict} />
          </section>
        ) : null}

        {tab === "analytics" ? (
          <section className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-soft">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-canvas p-4">
                <p className="text-2xl font-semibold text-navy-800">{stats.scans}</p>
                <p className="text-sm text-muted-foreground">{dict.homes.scans}</p>
                <p className="mt-1 text-xs text-muted-foreground">{dict.homes.scansHelp}</p>
              </div>
              <div className="rounded-2xl bg-canvas p-4">
                <p className="text-2xl font-semibold text-navy-800">{stats.clicks}</p>
                <p className="text-sm text-muted-foreground">{dict.homes.clicks}</p>
                <p className="mt-1 text-xs text-muted-foreground">{dict.homes.clicksHelp}</p>
              </div>
            </div>
            <ul className="divide-y divide-border">
              {stats.byPlace.map((item) => (
                <li key={item.placeId} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-navy-800">
                    {item.name}
                    {item.sponsored ? (
                      <span className="ml-2 text-xs text-muted-foreground">{dict.guide.sponsored}</span>
                    ) : null}
                  </span>
                  <span className="text-muted-foreground">
                    {item.clicks} · {item.bookings}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <FormField label={label} htmlFor={name} required={required}>
      <Input id={name} name={name} defaultValue={defaultValue} required={required} />
    </FormField>
  );
}

function Bilingual({
  label,
  name,
  sv,
  en,
  dict,
  area,
}: {
  label: string;
  name: string;
  sv: string;
  en: string;
  dict: { homes: { swedish: string; english: string } };
  area?: boolean;
}) {
  const Control = area ? Textarea : Input;
  return (
    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
      <FormField label={`${label} · ${dict.homes.swedish}`} htmlFor={`${name}Sv`}>
        <Control id={`${name}Sv`} name={`${name}Sv`} defaultValue={sv} />
      </FormField>
      <FormField label={`${label} · ${dict.homes.english}`} htmlFor={`${name}En`}>
        <Control id={`${name}En`} name={`${name}En`} defaultValue={en} />
      </FormField>
    </div>
  );
}

function MoveForm({
  action,
  propertyId,
  extra,
  direction,
  disabled,
}: {
  action: (formData: FormData) => Promise<void>;
  propertyId: string;
  extra: Record<string, string>;
  direction: -1 | 1;
  disabled?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="propertyId" value={propertyId} />
      {Object.entries(extra).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <input type="hidden" name="direction" value={String(direction)} />
      <Button type="submit" size="sm" variant="secondary" disabled={disabled}>
        {direction === -1 ? "↑" : "↓"}
      </Button>
    </form>
  );
}
