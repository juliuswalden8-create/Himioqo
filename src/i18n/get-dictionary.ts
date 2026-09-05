import { cookies, headers } from "next/headers";
import { FALLBACK_LOCALE, LOCALE_COOKIE } from "@/lib/constants";
import { normalizeLocale } from "@/lib/i18n/languages";
import { builtinDictionary, en, sv, type Dictionary } from "@/i18n/messages";
import { interpolate } from "@/i18n/interpolate";
import { translateText } from "@/lib/i18n/translate";

const cache = globalThis as unknown as { __hqDict?: Map<string, Dictionary> };

function dictCache() {
  if (!cache.__hqDict) cache.__hqDict = new Map();
  return cache.__hqDict;
}

export async function getLocale() {
  const jar = await cookies();
  const cookie = jar.get(LOCALE_COOKIE)?.value;
  if (cookie) return normalizeLocale(cookie);
  try {
    const { getSession } = await import("@/lib/session");
    const { getProfile } = await import("@/lib/data/store");
    const session = await getSession();
    const profile = session ? getProfile(session.profileId) : undefined;
    if (profile?.locale) return normalizeLocale(profile.locale);
  } catch {
    /* Public pages still work if the session layer is unavailable. */
  }
  const header = (await headers()).get("accept-language") ?? "";
  const first = header.split(",")[0]?.split(";")[0]?.trim();
  return normalizeLocale(first);
}

export async function getDictionary(locale?: string): Promise<Dictionary> {
  const code = locale ?? (await getLocale());
  const builtin = builtinDictionary(code);
  if (builtin) return builtin;
  const hit = dictCache().get(code);
  if (hit) return hit;
  const translated = await translateDictionary(en, code);
  dictCache().set(code, translated);
  return translated;
}

async function translateDictionary(source: Dictionary, locale: string): Promise<Dictionary> {
  async function walk(value: unknown): Promise<unknown> {
    if (typeof value === "string") {
      const result = await translateText(value, locale, FALLBACK_LOCALE);
      return result.translated;
    }
    if (Array.isArray(value)) {
      return Promise.all(value.map((item) => walk(item)));
    }
    if (value && typeof value === "object") {
      const entries = await Promise.all(
        Object.entries(value).map(async ([key, item]) => [key, await walk(item)]),
      );
      return Object.fromEntries(entries);
    }
    return value;
  }
  try {
    return (await walk(source)) as Dictionary;
  } catch {
    return en;
  }
}

export { interpolate, sv, en };
