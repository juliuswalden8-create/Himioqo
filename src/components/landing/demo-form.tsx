"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useAudience } from "@/components/landing/audience";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Dictionary } from "@/i18n/messages";
import { submitPilotAction } from "@/lib/pilot-actions";

const selectClass =
  "h-11 w-full rounded-xl border border-input bg-white px-3.5 text-sm text-ocean focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function DemoForm({ locale, dict }: { locale: string; dict: Dictionary }) {
  const { audience, setAudience } = useAudience();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const f = dict.marketing.form;
  const companyRequired = audience === "company";

  if (done) {
    return (
      <div role="status" className="rounded-3xl border border-green-100 bg-green-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-6 w-6 text-green-700" aria-hidden />
        <p className="mt-3 font-display text-lg font-semibold text-ocean">{f.thanksTitle}</p>
        <p className="mt-1 text-sm text-navy-600">{f.thanksBody}</p>
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
          if (result.error === "email") setError(f.invalidEmail);
          else if (result.error === "consent") setError(f.consentRequired);
          else if (result.error === "rate") setError(dict.errors.rate);
          else if (result.error === "required") setError(f.required);
          else setError(f.error);
        });
      }}
    >
      <div className="absolute left-[-10000px] h-px w-px overflow-hidden" aria-hidden="true">
        <input id="demo-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="demo-name">{f.name}</Label>
        <Input id="demo-name" name="name" required maxLength={120} autoComplete="name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="demo-company">{companyRequired ? f.company : f.companyOptional}</Label>
        <Input
          id="demo-company"
          name="company"
          required={companyRequired}
          maxLength={160}
          autoComplete="organization"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="demo-email">{f.email}</Label>
        <Input
          id="demo-email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="demo-phone">{f.phone}</Label>
        <Input id="demo-phone" name="phone" type="tel" required maxLength={40} autoComplete="tel" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="demo-count">{f.propertyCount}</Label>
        <select
          key={audience}
          id="demo-count"
          name="propertyCount"
          className={selectClass}
          defaultValue={audience === "private" ? "1-5" : "6-20"}
        >
          <option value="1-5">1–5</option>
          <option value="6-20">6–20</option>
          <option value="21-50">21–50</option>
          <option value="51-200">51–200</option>
          <option value="200+">200+</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="demo-type">{f.accountType}</Label>
        <select
          id="demo-type"
          name="accountType"
          className={selectClass}
          value={audience}
          onChange={(event) => {
            const next = event.target.value === "company" ? "company" : "private";
            setAudience(next);
          }}
        >
          <option value="private">{f.private}</option>
          <option value="company">{f.companyType}</option>
        </select>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="demo-message">{f.message}</Label>
        <Textarea id="demo-message" name="message" rows={4} maxLength={2000} required />
      </div>
      <label htmlFor="demo-consent" className="flex items-start gap-2.5 text-sm text-navy-700 sm:col-span-2">
        <input
          id="demo-consent"
          type="checkbox"
          name="consent"
          required
          className="mt-1 h-4 w-4 rounded border-input"
        />
        {f.consent}
      </label>
      {error ? (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          {error}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" variant="cta" disabled={pending}>
          {pending ? f.sending : f.submit}
        </Button>
      </div>
    </form>
  );
}

export function DemoSection({ locale, dict }: { locale: string; dict: Dictionary }) {
  const f = dict.marketing.form;
  return (
    <section id="demo" className="py-20 lg:py-24">
      <div className="container-marketing max-w-3xl">
        <h2 className="font-display text-3xl font-semibold text-ocean sm:text-4xl">{f.title}</h2>
        <p className="mt-3 text-base leading-relaxed text-navy-600">{f.subtitle}</p>
        <div className="mt-8 rounded-[1.75rem] border border-sand-200 bg-white p-6 shadow-soft sm:p-8">
          <DemoForm locale={locale} dict={dict} />
        </div>
      </div>
    </section>
  );
}
