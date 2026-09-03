import { LANGUAGE_NAMES, REGION_NAMES } from "@/lib/i18n/language-names";

export const PINNED_LOCALES = [
  "sv",
  "es",
  "en",
  "nb",
  "da",
  "fi",
  "de",
  "fr",
  "nl",
  "pt",
  "it",
  "pl",
  "uk",
  "ru",
  "ar",
  "zh",
  "ja",
  "ko",
  "hi",
  "tr",
] as const;

const ISO_639_1 = [
  "aa","ab","ae","af","ak","am","an","ar","as","av","ay","az","ba","be","bg","bi","bm","bn","bo","br","bs","ca","ce","ch","co","cr","cs","cu","cv","cy","da","de","dv","dz","ee","el","en","eo","es","et","eu","fa","ff","fi","fj","fo","fr","fy","ga","gd","gl","gn","gu","gv","ha","he","hi","ho","hr","ht","hu","hy","hz","ia","id","ie","ig","ii","ik","io","is","it","iu","ja","jv","ka","kg","ki","kj","kk","kl","km","kn","ko","kr","ks","ku","kv","kw","ky","la","lb","lg","li","ln","lo","lt","lu","lv","mg","mh","mi","mk","ml","mn","mr","ms","mt","my","na","nb","nd","ne","ng","nl","nn","no","nr","nv","ny","oc","oj","om","or","os","pa","pi","pl","ps","pt","qu","rm","rn","ro","ru","rw","sa","sc","sd","se","sg","si","sk","sl","sm","sn","so","sq","sr","ss","st","su","sv","sw","ta","te","tg","th","ti","tk","tl","tn","to","tr","ts","tt","tw","ty","ug","uk","ur","uz","ve","vi","vo","wa","wo","xh","yi","yo","za","zh","zu",
] as const;

const EXTRA_LOCALES = ["pt-BR", "zh-Hans", "zh-Hant", "en-GB", "en-US", "es-MX", "fr-CA"] as const;

export interface LanguageOption {
  code: string;
  native: string;
  english: string;
  region?: string;
}

function optionFor(code: string): LanguageOption {
  const [language, region] = code.split("-");
  const pair = LANGUAGE_NAMES[code] ?? LANGUAGE_NAMES[language || ""] ?? [code, code];
  return {
    code,
    native: pair[0] || code,
    english: pair[1] || code,
    region: region ? REGION_NAMES[region] : undefined,
  };
}

const extraSet = new Set<string>(EXTRA_LOCALES);
const optionCache = new Map<string, LanguageOption>();

export function allLanguages(): LanguageOption[] {
  const codes = [...PINNED_LOCALES, ...EXTRA_LOCALES, ...ISO_639_1];
  const seen = new Set<string>();
  const list: LanguageOption[] = [];
  for (const code of codes) {
    if (seen.has(code)) continue;
    seen.add(code);
    list.push(languageByCode(code));
  }
  return list;
}

export function languageByCode(code: string): LanguageOption {
  const hit = optionCache.get(code);
  if (hit) return hit;
  const option = optionFor(code);
  optionCache.set(code, option);
  return option;
}

export function isSupportedLocale(code: string) {
  const base = code.split("-")[0] ?? code;
  return ISO_639_1.includes(base as (typeof ISO_639_1)[number]) || extraSet.has(code);
}

export function normalizeLocale(value?: string | null) {
  if (!value) return "sv";
  if (isSupportedLocale(value)) return value;
  const base = value.split("-")[0] ?? value;
  if (isSupportedLocale(base)) return base;
  return "sv";
}

export const PINNED_COUNTRIES = [
  "SE","ES","GB","NO","DK","FI","DE","FR","NL","PT","IT","PL","UA","US","AE","CN","JP","KR","IN","TR","AR","BR","MX","CA","AU",
] as const;

const ISO_COUNTRIES = [
  "SE","ES","GB","NO","DK","FI","DE","FR","NL","PT","IT","PL","UA","US","AE","CN","JP","KR","IN","TR","AR","BR","MX","CA","AU",
  "AT","BE","CH","CZ","EE","GR","HU","IE","IS","LT","LU","LV","MT","RO","SK","SI","BG","HR","CY","AL","BA","MK","RS","ME",
  "BY","MD","GE","AM","AZ","KZ","UZ","NZ","ZA","EG","MA","TN","IL","SA","QA","KW","BH","OM","JO","LB","PK","BD","LK","TH",
  "VN","ID","MY","SG","PH","TW","HK","CL","CO","PE","UY","PY","BO","EC","CR","PA","GT","DO","CU","PR","NG","KE","GH","TZ",
] as const;

function regionLabel(code: string, locale = "sv") {
  try {
    return new Intl.DisplayNames([locale, "en"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

export function allCountries(): { code: string; name: string }[] {
  const names = ISO_COUNTRIES.map((code) => ({
    code,
    name: regionLabel(code, "sv"),
  }));
  const pinned = PINNED_COUNTRIES.map((code) => names.find((item) => item.code === code)!).filter(Boolean);
  const rest = names
    .filter((item) => !PINNED_COUNTRIES.includes(item.code as (typeof PINNED_COUNTRIES)[number]))
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
  return [...pinned, ...rest];
}

export function countryName(code: string, locale = "sv") {
  return regionLabel(code, locale);
}

export function flagEmoji(countryCode: string) {
  return countryCode
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2)
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}
