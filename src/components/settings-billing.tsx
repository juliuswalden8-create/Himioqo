import { Button } from "@/components/ui/button";
import { FormField, NativeSelect } from "@/components/ui/field";
import { interpolate } from "@/i18n/interpolate";
import type { Dictionary } from "@/i18n/messages";
import { savePayPerHomeAction } from "@/lib/actions";
import { FOUNDER_FIRST_NAME, PRICE_MONTHLY_EUR, PRICE_SETUP_EUR, SUPPORT_EMAIL } from "@/lib/constants";
import type { Organization } from "@/lib/types";

const PAY_KEYS = ["under10", "10-14", "14-20", "20plus", "unsure"] as const;

export function SettingsBilling({
  dict,
  org,
  days,
  trialEnded,
  saved,
}: {
  dict: Dictionary;
  org: Organization | undefined;
  days: number | null;
  trialEnded: boolean;
  saved: boolean;
}) {
  const prices = { monthly: String(PRICE_MONTHLY_EUR), setup: String(PRICE_SETUP_EUR) };
  const plan = trialEnded
    ? dict.settings.planEnded
    : org?.plan === "pro"
      ? dict.settings.planPro
      : org?.plan === "trial"
        ? dict.settings.planTrial
        : dict.settings.planNone;

  return (
    <section
      id="billing"
      className="scroll-mt-24 space-y-4 rounded-2xl border border-border bg-white p-5 shadow-soft"
    >
      <h2 className="text-sm font-semibold text-navy-800">{dict.settings.billing}</h2>
      <p className="text-sm text-muted-foreground">{interpolate(dict.settings.billingHelp, prices)}</p>
      <p className="text-sm text-navy-800">{dict.settings.billingPilot}</p>
      <ul className="space-y-1 text-sm text-navy-800">
        <li>{interpolate(dict.settings.priceMonth, { price: String(PRICE_MONTHLY_EUR) })}</li>
        <li>{interpolate(dict.settings.priceSetup, { price: String(PRICE_SETUP_EUR) })}</li>
        <li className="text-muted-foreground">{dict.settings.priceVolume}</li>
      </ul>
      <p className="text-sm text-navy-800">
        {plan}
        {days !== null && days > 0
          ? ` · ${interpolate(dict.settings.trialLeft, { days: String(days) })}`
          : ""}
      </p>
      {trialEnded ? (
        <p className="rounded-xl bg-canvas px-3 py-2 text-sm text-navy-800">
          {dict.dashboard.trialEndedHelp}
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">{dict.settings.choosePlanHelp}</p>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="cta">
          <a href={`mailto:${SUPPORT_EMAIL}`}>{dict.settings.choosePlan}</a>
        </Button>
        <Button asChild variant="secondary">
          <a href={`mailto:${SUPPORT_EMAIL}`}>
            {interpolate(dict.dashboard.trialEndedContact, { name: FOUNDER_FIRST_NAME })}
          </a>
        </Button>
      </div>

      <form action={savePayPerHomeAction} className="space-y-3 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-navy-800">{dict.settings.payTitle}</h3>
        <p className="text-sm text-muted-foreground">{dict.settings.payHelp}</p>
        <FormField label={dict.settings.payTitle} htmlFor="payPerHomeMonth">
          <NativeSelect
            id="payPerHomeMonth"
            name="payPerHomeMonth"
            defaultValue={org?.payPerHomeMonth ?? ""}
            required
          >
            <option value="">{dict.filters.all}</option>
            {PAY_KEYS.map((key) => (
              <option key={key} value={key}>
                {dict.settings.payOptions[key]}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        {saved && org?.payPerHomeMonth ? (
          <p className="text-sm text-green-700">{dict.settings.paySaved}</p>
        ) : null}
        <Button type="submit" variant="secondary">
          {dict.settings.paySubmit}
        </Button>
      </form>
    </section>
  );
}
