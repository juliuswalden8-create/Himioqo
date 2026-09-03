import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { flagEmoji, PINNED_COUNTRIES } from "@/lib/i18n/languages";

export interface DialCountry {
  iso: CountryCode;
  dial: string;
  flag: string;
}

export function dialCountries(): DialCountry[] {
  const countries = getCountries();
  const mapped = countries.map((iso) => ({
    iso,
    dial: `+${getCountryCallingCode(iso)}`,
    flag: flagEmoji(iso),
  }));
  const pinned = PINNED_COUNTRIES.filter((code) =>
    mapped.some((item) => item.iso === code),
  ) as CountryCode[];
  const rest = mapped
    .filter((item) => !pinned.includes(item.iso))
    .sort((a, b) => a.iso.localeCompare(b.iso));
  return [
    ...pinned.map((iso) => mapped.find((item) => item.iso === iso)!),
    ...rest,
  ];
}

export function formatAsYouType(iso: CountryCode, raw: string) {
  return new AsYouType(iso).input(raw);
}

export function toE164(iso: CountryCode, raw: string) {
  const parsed = parsePhoneNumberFromString(raw, iso);
  if (!parsed) return null;
  return parsed.number;
}

export function validatePhone(iso: CountryCode, raw: string) {
  if (!raw.trim()) return false;
  return isValidPhoneNumber(raw, iso);
}
