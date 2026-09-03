"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Dictionary } from "@/i18n/messages";
import { submitPilotAction } from "@/lib/pilot-actions";

const selectClass =
  "h-11 w-full rounded-xl border border-input bg-white px-3.5 text-sm text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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
      className="grid gap-4 sm:grid-cols-2"
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
      {/* Honeypot for bots. Hidden from users and assistive technology. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="pilot-website">Website</label>
        <input id="pilot-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pilot-name">{dict.pilot.name}</Label>
        <Input id="pilot-name" name="name" required maxLength={120} autoComplete="name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pilot-company">{dict.pilot.company}</Label>
        <Input
          id="pilot-company"
          name="company"
          required
          maxLength={160}
          autoComplete="organization"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pilot-email">{dict.pilot.email}</Label>
        <Input
          id="pilot-email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pilot-phone">{dict.pilot.phone}</Label>
        <Input id="pilot-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pilot-region">{dict.pilot.region}</Label>
        <Input
          id="pilot-region"
          name="region"
          maxLength={120}
          placeholder={dict.pilot.regionHelp}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pilot-count">{dict.pilot.propertyCount}</Label>
        <select id="pilot-count" name="propertyCount" className={selectClass} defaultValue="6-20">
          <option value="1-5">1–5</option>
          <option value="6-20">6–20</option>
          <option value="21-50">21–50</option>
          <option value="51-200">51–200</option>
          <option value="200+">200+</option>
        </select>
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="pilot-type">{dict.pilot.rentalType}</Label>
        <select id="pilot-type" name="rentalType" className={selectClass} defaultValue="shortTerm">
          <option value="shortTerm">{dict.pilot.rentalTypes.shortTerm}</option>
          <option value="longTerm">{dict.pilot.rentalTypes.longTerm}</option>
          <option value="mixed">{dict.pilot.rentalTypes.mixed}</option>
        </select>
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="pilot-method">{dict.pilot.currentMethod}</Label>
        <Textarea
          id="pilot-method"
          name="currentMethod"
          rows={2}
          maxLength={500}
          placeholder={dict.pilot.currentMethodHelp}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="pilot-valuable">{dict.pilot.mostValuable}</Label>
        <Textarea id="pilot-valuable" name="mostValuable" rows={2} maxLength={500} />
      </div>

      <label className="flex items-start gap-2.5 text-sm text-navy-700 sm:col-span-2">
        <input type="checkbox" name="wantsPilot" defaultChecked className="mt-1" />
        {dict.pilot.wantsPilot}
      </label>
      <label className="flex items-start gap-2.5 text-sm text-navy-700 sm:col-span-2">
        <input type="checkbox" name="consent" required className="mt-1" />
        {dict.pilot.consent}
      </label>

      {error ? (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          {error}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? dict.pilot.sending : dict.pilot.submit}
        </Button>
      </div>
    </form>
  );
}
