"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useAudience } from "@/components/landing/audience";
import { Button } from "@/components/ui/button";
import {
  FormError,
  FormField,
  NativeCheckbox,
  NativeSelect,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import type { Dictionary } from "@/i18n/messages";
import { submitPilotAction } from "@/lib/pilot-actions";

export function DemoForm({ locale, dict }: { locale: string; dict: Dictionary }) {
  const { audience, setAudience } = useAudience();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const f = dict.marketing.form;
  const p = f.placeholders;
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
          if (result.error === "email") setError(f.invalidEmail);
          else if (result.error === "phone") setError(f.invalidPhone);
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

      <FormField label={f.name} htmlFor="demo-name" required>
        <Input
          id="demo-name"
          name="name"
          required
          maxLength={120}
          autoComplete="name"
          placeholder={p.name}
        />
      </FormField>
      <FormField label={companyRequired ? f.company : f.companyOptional} htmlFor="demo-company" required={companyRequired}>
        <Input
          id="demo-company"
          name="company"
          required={companyRequired}
          maxLength={160}
          autoComplete="organization"
          placeholder={p.company}
        />
      </FormField>
      <FormField label={f.email} htmlFor="demo-email" required>
        <Input
          id="demo-email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
          placeholder={p.email}
        />
      </FormField>
      <FormField label={f.phone} htmlFor="demo-phone" required>
        <Input
          id="demo-phone"
          name="phone"
          type="tel"
          required
          maxLength={40}
          autoComplete="tel"
          placeholder={p.phone}
        />
      </FormField>
      <FormField label={f.propertyCount} htmlFor="demo-count" required>
        <NativeSelect
          key={audience}
          id="demo-count"
          name="propertyCount"
          defaultValue={audience === "private" ? "1-5" : "6-20"}
          aria-label={p.propertyCount}
        >
          <option value="1-5">1–5</option>
          <option value="6-20">6–20</option>
          <option value="21-50">21–50</option>
          <option value="51-200">51–200</option>
          <option value="200+">200+</option>
        </NativeSelect>
      </FormField>
      <FormField label={f.accountType} htmlFor="demo-type" required>
        <SegmentedControl
          id="demo-type"
          name="accountType"
          value={audience}
          onChange={(next) => setAudience(next === "company" ? "company" : "private")}
          options={[
            { value: "private", label: f.private },
            { value: "company", label: f.companyType },
          ]}
        />
      </FormField>
      <FormField label={f.message} htmlFor="demo-message" required className="sm:col-span-2">
        <Textarea
          id="demo-message"
          name="message"
          rows={4}
          maxLength={2000}
          required
          placeholder={p.message}
        />
      </FormField>
      <label htmlFor="demo-consent" className="flex items-start gap-3 text-[15px] leading-relaxed text-ocean sm:col-span-2">
        <NativeCheckbox id="demo-consent" name="consent" required />
        {f.consent}
      </label>
      {error ? <FormError className="sm:col-span-2">{error}</FormError> : null}
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
    <section id="demo" className="scroll-mt-[5.75rem] py-16 lg:py-20">
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
