import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import type { Dictionary } from "@/i18n/messages";
import { INDEXABLE_ROBOTS, NOINDEX_ROBOTS } from "@/lib/security/robots";

export async function pageMetadata(
  pick: (dict: Dictionary) => string,
  options?: { index?: boolean },
): Promise<Metadata> {
  const dict = await getDictionary(await getLocale());
  return {
    title: pick(dict),
    robots: options?.index ? INDEXABLE_ROBOTS : NOINDEX_ROBOTS,
  };
}
