import { getDictionary } from "@/i18n/get-dictionary";
import { interpolate } from "@/i18n/interpolate";
import { sendAccessEmail } from "@/lib/email/send";
import { getCase, getOrganizationLocale } from "@/lib/data/store";
import { statusLabel } from "@/lib/labels";
import { requestUrl } from "@/lib/request-origin";
import type { CaseStatus } from "@/lib/types";

export async function notifyReporter(organizationId: string, caseId: string, status: CaseStatus) {
  const item = getCase(organizationId, caseId);
  const email = item?.reporterEmail?.trim();
  if (!item || !email) return;
  const dict = await getDictionary(getOrganizationLocale(organizationId));
  const url = await requestUrl(`/t/${item.trackToken}`);
  await sendAccessEmail({
    to: email,
    subject: interpolate(dict.report.mailSubject, { ref: item.reference }),
    title: dict.report.mailTitle,
    body: interpolate(dict.report.mailBody, {
      ref: item.reference,
      status: statusLabel(dict, status),
    }),
    cta: dict.report.mailCta,
    url,
    ttl: dict.report.mailTtl,
    dict,
  });
}
