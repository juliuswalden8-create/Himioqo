import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import type { Dictionary } from "@/i18n/messages";

export async function pageMetadata(
  pick: (dict: Dictionary) => string,
): Promise<Metadata> {
  const dict = await getDictionary(await getLocale());
  return { title: pick(dict) };
}
