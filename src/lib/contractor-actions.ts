"use server";

import { revalidatePath } from "next/cache";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  contractorAddMessage,
  contractorAddPhotos,
  contractorRespond,
  contractorUpdateStatus,
  getCaseByWorkToken,
  getOrganizationLocale,
  pushNotification,
} from "@/lib/data/store";
import { statusLabel } from "@/lib/labels";
import { CONTRACTOR_STATUSES, type CaseStatus } from "@/lib/types";
import { parsePhotoPayload } from "@/lib/uploads";

function revalidateAll() {
  revalidatePath("/", "layout");
}

/**
 * The contractor never has a session. Every action is authorised purely by the
 * work token, so each one re-resolves the case from the token rather than
 * trusting a case id from the form.
 */
function orgDictionary(organizationId: string) {
  return getDictionary(getOrganizationLocale(organizationId));
}

export async function contractorRespondAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const accept = String(formData.get("accept") ?? "") === "1";
  const reason = String(formData.get("reason") ?? "").slice(0, 500);
  const actorName = String(formData.get("actorName") ?? "").trim();

  const existing = getCaseByWorkToken(token);
  if (!existing) return { error: "notFound" as const };

  try {
    const item = contractorRespond({
      token,
      accept,
      reason,
      actorName: actorName || existing.contractor?.name || "Hantverkare",
    });
    const dict = await orgDictionary(item.organizationId);
    pushNotification({
      organizationId: item.organizationId,
      kind: accept ? "contractor_accepted" : "contractor_declined",
      title: accept ? dict.notifications.contractorAccepted : dict.notifications.contractorDeclined,
      body: `${item.reference} · ${item.property.name}`,
      href: `/app/cases/${item.id}`,
    });
  } catch {
    return { error: "notFound" as const };
  }
  revalidateAll();
}

export async function contractorStatusAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const status = String(formData.get("status") ?? "") as CaseStatus;
  if (!CONTRACTOR_STATUSES.includes(status)) return { error: "status" as const };

  const existing = getCaseByWorkToken(token);
  if (!existing) return { error: "notFound" as const };
  if (!existing.contractorAcceptedAt) return { error: "notAccepted" as const };

  const dict = await orgDictionary(existing.organizationId);
  const item = contractorUpdateStatus({
    token,
    status,
    actorName: existing.contractor?.name ?? "Hantverkare",
    label: statusLabel(dict, status),
  });
  if (status === "resolved") {
    pushNotification({
      organizationId: item.organizationId,
      kind: "contractor_completed",
      title: dict.notifications.contractorCompleted,
      body: `${item.reference} · ${item.property.name}`,
      href: `/app/cases/${item.id}`,
    });
  }
  revalidateAll();
}

export async function contractorPhotosAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const kind = String(formData.get("kind") ?? "after") === "before" ? "before" : "after";

  const existing = getCaseByWorkToken(token);
  if (!existing) return { error: "notFound" as const };
  if (!existing.contractorAcceptedAt) return { error: "notAccepted" as const };

  const parsed = parsePhotoPayload(formData.get("photos"));
  if (!parsed.ok) return { error: parsed.reason };
  if (!parsed.photos.length) return { error: "empty" as const };

  contractorAddPhotos({
    token,
    kind,
    photos: parsed.photos,
    actorName: existing.contractor?.name ?? "Hantverkare",
  });
  revalidateAll();
}

export async function contractorMessageAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "empty" as const };
  if (text.length > 2000) return { error: "long" as const };

  const existing = getCaseByWorkToken(token);
  if (!existing) return { error: "notFound" as const };

  contractorAddMessage({
    token,
    text,
    authorName: existing.contractor?.name ?? "Hantverkare",
    locale: String(formData.get("locale") ?? "sv"),
  });
  revalidateAll();
}
