"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { CountryField, PhoneField } from "@/components/phone-field";
import { LanguagePicker } from "@/components/language-picker";
import { ProgressSteps } from "@/components/progress-steps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/i18n/messages";
import { registerTrialAction } from "@/lib/signup-actions";
import type { AccountType } from "@/lib/types";
import { ACCOUNT_TYPES } from "@/lib/types";

export function RegisterForm({
  dict,
  locale,
  countries,
  defaultAccountType = "company",
}: {
  dict: Dictionary;
  locale: string;
  countries: { code: string; name: string }[];
  defaultAccountType?: AccountType;
}) {
  const [lang, setLang] = useState(locale);
  const [accountType, setAccountType] = useState<AccountType>(defaultAccountType);
  const isPrivate = accountType === "private";
  const loadedAt = useMemo(() => Date.now(), []);
  const [state, action, pending] = useActionState(registerTrialAction, null);
  const error = state?.error ? dict.errors[state.error as keyof typeof dict.errors] ?? dict.errors.generic : null;

  return (
    <form action={action} className="relative space-y-5">
      <input type="hidden" name="formLoadedAt" value={loadedAt} />
      <input
        type="text"
        name="companyWebsite"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <ProgressSteps
        current={0}
        steps={[dict.register.step1, dict.register.step2, dict.register.step3]}
      />

      <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
        <p className="text-sm font-medium text-navy-800">{dict.register.offer}</p>
        <ul className="mt-3 space-y-1.5">
          {dict.register.offerItems.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-navy-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <input type="hidden" name="accountType" value={accountType} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-navy-700">
          {dict.register.accountTypeLabel}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {ACCOUNT_TYPES.map((type) => {
            const selected = accountType === type;
            return (
              <button
                key={type}
                type="button"
                aria-pressed={selected}
                onClick={() => setAccountType(type)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-navy-700 bg-navy-700/5 ring-1 ring-navy-700"
                    : "border-border bg-white hover:border-navy-300"
                }`}
              >
                <span className="block text-sm font-semibold text-navy-800">
                  {dict.register.accountTypes[type].title}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {dict.register.accountTypes[type].help}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={dict.register.firstName} htmlFor="firstName">
          <Input id="firstName" name="firstName" autoComplete="given-name" required />
        </Field>
        <Field label={dict.register.lastName} htmlFor="lastName">
          <Input id="lastName" name="lastName" autoComplete="family-name" required />
        </Field>
      </div>
      <Field
        label={isPrivate ? dict.register.companyOptional : dict.register.company}
        htmlFor="company"
      >
        <Input
          id="company"
          name="company"
          autoComplete="organization"
          required={!isPrivate}
          placeholder={isPrivate ? dict.register.companyPrivateHelp : undefined}
        />
      </Field>
      <Field label={dict.register.email} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label={dict.register.phone} htmlFor="phone">
        <PhoneField dict={dict} />
      </Field>
      <Field label={dict.register.country} htmlFor="country">
        <CountryField countries={countries} />
      </Field>
      <Field label={dict.register.language} htmlFor="locale">
        <LanguagePicker dict={dict} value={lang} onChange={setLang} />
      </Field>
      <Field label={dict.register.units} htmlFor="unitBand">
        <select
          id="unitBand"
          name="unitBand"
          className="h-11 w-full rounded-xl border border-input bg-white px-3.5 text-sm"
          defaultValue={isPrivate ? "1-5" : "6-20"}
        >
          {Object.entries(dict.units).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input
          type="checkbox"
          name="terms"
          required
          className="mt-1 h-4 w-4 rounded border-input"
        />
        <span>
          {dict.register.terms}{" "}
          <Link href="/terms" className="underline">
            {dict.legal.terms}
          </Link>{" "}
          ·{" "}
          <Link href="/privacy" className="underline">
            {dict.legal.privacy}
          </Link>
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
        <input type="checkbox" name="marketing" className="mt-1 h-4 w-4 rounded border-input" />
        <span>{dict.register.marketing}</span>
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? dict.register.submitting : dict.register.submit}
      </Button>
      <p className="text-center text-sm text-muted-foreground">{dict.register.fine}</p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
