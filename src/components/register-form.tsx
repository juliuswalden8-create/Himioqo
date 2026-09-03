"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { CountryField, PhoneField } from "@/components/phone-field";
import { LanguagePicker } from "@/components/language-picker";
import { ProgressSteps } from "@/components/progress-steps";
import { Button } from "@/components/ui/button";
import { FormError, FormField, NativeCheckbox, NativeSelect } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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

      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <FormField label={dict.register.firstName} htmlFor="firstName" required>
          <Input id="firstName" name="firstName" autoComplete="given-name" required />
        </FormField>
        <FormField label={dict.register.lastName} htmlFor="lastName" required>
          <Input id="lastName" name="lastName" autoComplete="family-name" required />
        </FormField>
      </div>
      <FormField
        label={isPrivate ? dict.register.companyOptional : dict.register.company}
        htmlFor="company"
        required={!isPrivate}
      >
        <Input
          id="company"
          name="company"
          autoComplete="organization"
          required={!isPrivate}
          placeholder={isPrivate ? dict.register.companyPrivateHelp : undefined}
        />
      </FormField>
      <FormField label={dict.register.email} htmlFor="email" required>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </FormField>
      <FormField label={dict.register.phone} htmlFor="phone" required>
        <PhoneField dict={dict} />
      </FormField>
      <FormField label={dict.register.country} htmlFor="country">
        <CountryField countries={countries} />
      </FormField>
      <FormField label={dict.register.language} htmlFor="locale">
        <LanguagePicker dict={dict} value={lang} onChange={setLang} />
      </FormField>
      <FormField label={dict.register.units} htmlFor="unitBand">
        <NativeSelect
          id="unitBand"
          name="unitBand"
          defaultValue={isPrivate ? "1-5" : "6-20"}
        >
          {Object.entries(dict.units).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </FormField>

      <label className="flex items-start gap-3 text-[15px] leading-relaxed text-ocean">
        <NativeCheckbox name="terms" required />
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
      <label className="flex items-start gap-3 text-[15px] leading-relaxed text-muted-foreground">
        <NativeCheckbox name="marketing" />
        <span>{dict.register.marketing}</span>
      </label>

      {error ? <FormError>{error}</FormError> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? dict.register.submitting : dict.register.submit}
      </Button>
      <p className="text-center text-sm text-muted-foreground">{dict.register.fine}</p>
    </form>
  );
}
