"use server";

import { revalidatePath } from "next/cache";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  contractorAddMessage,
  contractorAddPhotos,
  contractorMayAccessCase,
  contractorRespond,
  contractorUpdateStatus,
  getCase,
  getCaseByWorkToken,
  getOrganizationLocale,
  pushNotification,
} from "@/lib/data/store";
import { statusLabel } from "@/lib/labels";
import { getSession } from "@/lib/session";
import { CONTRACTOR_STATUSES, type CaseStatus } from "@/lib/types";
import { parsePhotoPayload } from "@/lib/uploads";
import { notifyReporter } from "@/lib/case-notify";

function revalidateAll() {
  revalidatePath("/", "layout");
}

function orgDictionary(organizationId: string) {
  return getDictionary(getOrganizationLocale(organizationId));
}

async function resolveContractorCase(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const caseId = String(formData.get("caseId") ?? "");
  if (token) {
    const item = getCaseByWorkToken(token);
    return item ? { item, token: item.workToken ?? token } : null;
  }
  const session = await getSession();
  if (!session || session.role !== "contractor" || !caseId) return null;
  const item = getCase(session.organizationId, caseId);
  if (!item || !item.workToken || !contractorMayAccessCase(session.membership, item)) {
    return null;
  }
  return { item, token: item.workToken };
}

export async function contractorRespondAction(formData: FormData) {
  const resolved = await resolveContractorCase(formData);
  if (!resolved) return { error: "notFound" as const };
  const accept = String(formData.get("accept") ?? "") === "1";
  const reason = String(formData.get("reason") ?? "").slice(0, 500);
  const actorName = String(formData.get("actorName") ?? "").trim();

  try {
    const item = contractorRespond({
      token: resolved.token,
      accept,
      reason,
      actorName: actorName || resolved.item.contractor?.name || "Hantverkare",
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
  const resolved = await resolveContractorCase(formData);
  if (!resolved) return { error: "notFound" as const };
  const status = String(formData.get("status") ?? "") as CaseStatus;
  if (!CONTRACTOR_STATUSES.includes(status)) return { error: "status" as const };
  if (!resolved.item.contractorAcceptedAt) return { error: "notAccepted" as const };

  const dict = await orgDictionary(resolved.item.organizationId);
  const item = contractorUpdateStatus({
    token: resolved.token,
    status,
    actorName: resolved.item.contractor?.name ?? "Hantverkare",
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
  await notifyReporter(item.organizationId, item.id, item.status);
  revalidateAll();
}

export async function contractorPhotosAction(formData: FormData) {
  const resolved = await resolveContractorCase(formData);
  if (!resolved) return { error: "notFound" as const };
  if (!resolved.item.contractorAcceptedAt) return { error: "notAccepted" as const };
  const kind = String(formData.get("kind") ?? "after") === "before" ? "before" : "after";

  const parsed = parsePhotoPayload(formData.get("photos"));
  if (!parsed.ok) return { error: parsed.reason };
  if (!parsed.photos.length) return { error: "empty" as const };

  contractorAddPhotos({
    token: resolved.token,
    kind,
    photos: parsed.photos,
    actorName: resolved.item.contractor?.name ?? "Hantverkare",
  });
  revalidateAll();
}

export async function contractorMessageAction(formData: FormData) {
  const resolved = await resolveContractorCase(formData);
  if (!resolved) return { error: "notFound" as const };
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "empty" as const };
  if (text.length > 2000) return { error: "long" as const };

  contractorAddMessage({
    token: resolved.token,
    text,
    authorName: resolved.item.contractor?.name ?? "Hantverkare",
    locale: String(formData.get("locale") ?? "sv"),
  });
  revalidateAll();
}
