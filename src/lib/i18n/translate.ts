import { FALLBACK_LOCALE } from "@/lib/constants";

export interface Translated {
  original: string;
  translated: string;
  locale: string;
  failed: boolean;
}

const memory = globalThis as unknown as {
  __hqTx?: Map<string, Translated>;
};

function txCache() {
  if (!memory.__hqTx) memory.__hqTx = new Map();
  return memory.__hqTx;
}

function cacheKey(text: string, target: string, source: string) {
  return `${source}:${target}:${text}`;
}

export async function translateText(
  text: string,
  targetLocale: string,
  sourceLocale = FALLBACK_LOCALE,
): Promise<Translated> {
  const target = targetLocale.split("-")[0] ?? targetLocale;
  const source = sourceLocale.split("-")[0] ?? sourceLocale;
  if (!text.trim() || target === source) {
    return { original: text, translated: text, locale: source, failed: false };
  }

  const key = cacheKey(text, target, source);
  const cached = txCache().get(key);
  if (cached) return cached;

  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    const fallback: Translated = {
      original: text,
      translated: text,
      locale: source,
      failed: true,
    };
    txCache().set(key, fallback);
    return fallback;
  }

  try {
    const body = new URLSearchParams({
      text,
      source_lang: source.toUpperCase(),
      target_lang: mapDeepL(target),
    });
    const response = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!response.ok) throw new Error("deepl");
    const json = (await response.json()) as {
      translations?: { text?: string }[];
    };
    const translated = json.translations?.[0]?.text ?? text;
    const result: Translated = {
      original: text,
      translated,
      locale: target,
      failed: translated === text && target !== source,
    };
    txCache().set(key, result);
    return result;
  } catch {
    const fallback: Translated = {
      original: text,
      translated: text,
      locale: source,
      failed: true,
    };
    txCache().set(key, fallback);
    return fallback;
  }
}

export async function localizeForViewer(
  original: string,
  sourceLocale: string,
  viewerLocale: string,
): Promise<{ text: string; originalText?: string; translated: boolean }> {
  const source = sourceLocale.split("-")[0] ?? sourceLocale;
  const target = viewerLocale.split("-")[0] ?? viewerLocale;
  if (!original.trim() || source === target) {
    return { text: original, translated: false };
  }

  let result = await translateText(original, target, source);
  if (result.failed && target !== FALLBACK_LOCALE) {
    result = await translateText(original, FALLBACK_LOCALE, source);
  }

  const text = result.failed ? original : result.translated;
  const translated = text !== original;
  return {
    text,
    originalText: translated ? original : undefined,
    translated,
  };
}

function mapDeepL(locale: string) {
  const map: Record<string, string> = {
    en: "EN",
    sv: "SV",
    es: "ES",
    de: "DE",
    fr: "FR",
    it: "IT",
    nl: "NL",
    pl: "PL",
    pt: "PT",
    ru: "RU",
    ja: "JA",
    zh: "ZH",
    ko: "KO",
    tr: "TR",
    uk: "UK",
    nb: "NB",
    da: "DA",
    fi: "FI",
    ar: "AR",
  };
  return map[locale] ?? "EN";
}
