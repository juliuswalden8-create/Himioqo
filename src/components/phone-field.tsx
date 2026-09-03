"use client";

import { ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/i18n/messages";
import { countryName, flagEmoji } from "@/lib/i18n/languages";
import { dialCountries, formatAsYouType } from "@/lib/phone";
import type { CountryCode } from "libphonenumber-js";

export function PhoneField({
  dict,
  defaultCountry = "SE",
}: {
  dict: Dictionary;
  defaultCountry?: CountryCode;
}) {
  const countries = useMemo(() => dialCountries(), []);
  const [iso, setIso] = useState<CountryCode>(defaultCountry);
  const [national, setNational] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const current = countries.find((item) => item.iso === iso) ?? countries[0];

  const filtered = countries.filter((item) => {
    const q = query.toLowerCase();
    if (!q) return true;
    const name = countryName(item.iso, "en").toLowerCase();
    return (
      item.iso.toLowerCase().includes(q) ||
      item.dial.includes(q) ||
      name.includes(q)
    );
  });

  return (
    <div className="flex gap-2">
      <input type="hidden" name="phoneCountry" value={iso} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-input bg-white px-3 text-sm"
            aria-label={dict.register.countryCode}
          >
            <span aria-hidden>{current?.flag}</span>
            <span>{current?.dial}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={dict.register.searchCountry}
            className="mb-2 h-10"
          />
          <ul className="max-h-64 overflow-y-auto">
            {filtered.map((item) => (
              <li key={item.iso}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-navy-50"
                  onClick={() => {
                    setIso(item.iso);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <span>{item.flag}</span>
                  <span suppressHydrationWarning className="flex-1 text-left">
                    {countryName(item.iso)}
                  </span>
                  <span className="text-muted-foreground">{item.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
      <Input
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
        value={national}
        onChange={(event) => setNational(formatAsYouType(iso, event.target.value))}
        className="flex-1"
        placeholder={current ? `${current.dial} …` : ""}
      />
    </div>
  );
}

export function CountryField({
  name = "country",
  defaultValue = "SE",
  countries,
}: {
  name?: string;
  defaultValue?: string;
  countries: { code: string; name: string }[];
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base">
        {flagEmoji(value)}
      </span>
      <select
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-input bg-white pl-10 pr-8 text-sm text-navy-800"
      >
        {countries.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );
}
