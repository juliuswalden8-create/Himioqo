"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  FormError,
  FormField,
  NativeCheckbox,
  NativeSelect,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Dictionary } from "@/i18n/messages";
import { submitPilotAction } from "@/lib/pilot-actions";

export function PilotForm({ locale, dict }: { locale: string; dict: Dictionary }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-green-100 bg-green-50 p-6 text-center"
      >
        <CheckCircle2 className="mx-auto h-6 w-6 text-green-700" aria-hidden />
        <p className="mt-3 font-semibold text-navy-800">{dict.pilot.thanksTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{dict.pilot.thanksBody}</p>
      </div>
    );
  }

  return (
    <form
      className="grid gap-x-6 gap-y-5 sm:grid-cols-2"
      action={(data) => {
        data.set("locale", locale);
        setError(null);
        start(async () => {
          const result = await submitPilotAction(data);
          if (result.ok) {
            setDone(true);
            return;
          }
          if (result.error === "email") setError(dict.pilot.invalidEmail);
          else if (result.error === "consent") setError(dict.pilot.consentRequired);
          else if (result.error === "rate") setError(dict.errors.rate);
          else if (result.error === "required") setError(dict.pilot.required);
          else setError(dict.pilot.error);
        });
      }}
    >
      <div className="hidden" aria-hidden>
        <label htmlFor="pilot-website">Website</label>
        <input id="pilot-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <FormField label={dict.pilot.name} htmlFor="pilot-name" required>
        <Input id="pilot-name" name="name" required maxLength={120} autoComplete="name" />
      </FormField>
      <FormField label={dict.pilot.company} htmlFor="pilot-company" required>
        <Input
          id="pilot-company"
          name="company"
          required
          maxLength={160}
          autoComplete="organization"
        />
      </FormField>
      <FormField label={dict.pilot.email} htmlFor="pilot-email" required>
        <Input
          id="pilot-email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
        />
      </FormField>
      <FormField label={dict.pilot.phone} htmlFor="pilot-phone">
        <Input id="pilot-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" />
      </FormField>

      <FormField label={dict.pilot.region} htmlFor="pilot-region">
        <Input
          id="pilot-region"
          name="region"
          maxLength={120}
          placeholder={dict.pilot.regionHelp}
        />
      </FormField>
      <FormField label={dict.pilot.propertyCount} htmlFor="pilot-count">
        <NativeSelect id="pilot-count" name="propertyCount" defaultValue="6-20">
          <option value="1-5">1–5</option>
          <option value="6-20">6–20</option>
          <option value="21-50">21–50</option>
          <option value="51-200">51–200</option>
          <option value="200+">200+</option>
        </NativeSelect>
      </FormField>

      <FormField label={dict.pilot.rentalType} htmlFor="pilot-type" className="sm:col-span-2">
        <NativeSelect id="pilot-type" name="rentalType" defaultValue="shortTerm">
          <option value="shortTerm">{dict.pilot.rentalTypes.shortTerm}</option>
          <option value="longTerm">{dict.pilot.rentalTypes.longTerm}</option>
          <option value="mixed">{dict.pilot.rentalTypes.mixed}</option>
        </NativeSelect>
      </FormField>

      <FormField label={dict.pilot.currentMethod} htmlFor="pilot-method" className="sm:col-span-2">
        <Textarea
          id="pilot-method"
          name="currentMethod"
          rows={2}
          maxLength={500}
          placeholder={dict.pilot.currentMethodHelp}
        />
      </FormField>
      <FormField label={dict.pilot.mostValuable} htmlFor="pilot-valuable" className="sm:col-span-2">
        <Textarea id="pilot-valuable" name="mostValuable" rows={2} maxLength={500} />
      </FormField>

      <label className="flex items-start gap-3 text-[15px] leading-relaxed text-ocean sm:col-span-2">
        <NativeCheckbox name="wantsPilot" defaultChecked />
        {dict.pilot.wantsPilot}
      </label>
      <label className="flex items-start gap-3 text-[15px] leading-relaxed text-ocean sm:col-span-2">
        <NativeCheckbox name="consent" required />
        {dict.pilot.consent}
      </label>

      {error ? <FormError className="sm:col-span-2">{error}</FormError> : null}

      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? dict.pilot.sending : dict.pilot.submit}
        </Button>
      </div>
    </form>
  );
}
