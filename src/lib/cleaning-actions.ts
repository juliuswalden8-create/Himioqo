"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  addCleaner,
  addCleaningPhotos,
  approveCleaningJob,
  createCleaningJob,
  getCleaningJobByToken,
  getOrganization,
  getOrganizationLocale,
  pushNotification,
  reportCleaningIssue,
  returnCleaningJob,
  toggleCleaningItem,
  updateCleaningStatus,
  upsertCleaningSchedule,
} from "@/lib/data/store";
import { sendCleaningCompleteNotice } from "@/lib/email/send";
import { requireSession } from "@/lib/session";
import {
  CLEANING_ISSUE_KINDS,
  type CleaningIssueKind,
  type CleaningStatus,
} from "@/lib/types";
import { parsePhotoPayload } from "@/lib/uploads";

function revalidateCleaning() {
  revalidatePath("/", "layout");
}

export async function createCleaningJobAction(formData: FormData) {
  const session = await requireSession();
  const propertyId = String(formData.get("propertyId") ?? "");
  const cleanerId = String(formData.get("cleanerId") ?? "") || undefined;
  const scheduledAt = String(formData.get("scheduledAt") ?? "");
  const instructions = String(formData.get("instructions") ?? "");
  const labelsRaw = String(formData.get("labels") ?? "");
  let labels: Record<string, string> = {};
  try {
    labels = JSON.parse(labelsRaw) as Record<string, string>;
  } catch {
    labels = {};
  }
  if (!propertyId) redirect("/app/cleaning");
  const job = createCleaningJob({
    organizationId: session.organizationId,
    propertyId,
    cleanerId,
    scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString(),
    instructions,
    labels,
  });
  revalidateCleaning();
  redirect(`/app/cleaning/${job.id}`);
}

export async function addCleanerAction(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  if (!name || !contactName) redirect("/app/cleaning");
  addCleaner(session.organizationId, {
    name,
    contactName,
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
  });
  revalidateCleaning();
  redirect("/app/cleaning");
}

export async function saveScheduleAction(formData: FormData) {
  const session = await requireSession();
  const propertyId = String(formData.get("propertyId") ?? "");
  if (!propertyId) redirect("/app/cleaning");
  upsertCleaningSchedule({
    organizationId: session.organizationId,
    propertyId,
    cleanerId: String(formData.get("cleanerId") ?? "") || undefined,
    offsetHours: Number(formData.get("offsetHours") ?? 2) || 2,
    instructions: String(formData.get("instructions") ?? ""),
  });
  revalidateCleaning();
  redirect("/app/cleaning");
}

export async function approveCleaningAction(formData: FormData) {
  const session = await requireSession();
  const job = approveCleaningJob(session.organizationId, String(formData.get("jobId") ?? ""));
  const dict = await getDictionary(getOrganizationLocale(job.organizationId));
  pushNotification({
    organizationId: job.organizationId,
    kind: "property_ready",
    title: dict.notifications.propertyReady,
    body: job.property.name,
    href: `/app/properties/${job.propertyId}`,
  });
  revalidateCleaning();
}

export async function returnCleaningAction(formData: FormData) {
  const session = await requireSession();
  returnCleaningJob(
    session.organizationId,
    String(formData.get("jobId") ?? ""),
    String(formData.get("comment") ?? ""),
  );
  revalidateCleaning();
}

export async function cleanerStatusAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const status = String(formData.get("status") ?? "") as CleaningStatus;
  if (!token || !["accepted", "in_progress", "completed"].includes(status)) return;
  if (!getCleaningJobByToken(token)) return { error: "notFound" as const };

  const job = updateCleaningStatus(token, status, true);
  const dict = await getDictionary(getOrganizationLocale(job.organizationId));

  if (status === "in_progress") {
    pushNotification({
      organizationId: job.organizationId,
      kind: "cleaning_started",
      title: dict.notifications.cleaningStarted,
      body: job.property.name,
      href: `/app/cleaning/${job.id}`,
    });
  }

  if (status === "completed") {
    pushNotification({
      organizationId: job.organizationId,
      kind: "cleaning_completed",
      title: dict.notifications.cleaningCompleted,
      body: job.property.name,
      href: `/app/cleaning/${job.id}`,
    });
    const org = getOrganization(job.organizationId);
    await sendCleaningCompleteNotice({
      to: org?.supportEmail ? [org.supportEmail] : ["hej@homioqo.se"],
      propertyName: job.property.name,
      completedAt: job.completedAt ?? "",
    });
  }
  revalidateCleaning();
}

export async function toggleCheckAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const done = String(formData.get("done") ?? "") === "true";
  if (!token || !itemId) return;
  toggleCleaningItem(token, itemId, done);
  revalidateCleaning();
}

export async function addCleaningPhotosAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const kind = String(formData.get("kind") ?? "after") === "before" ? "before" : "after";
  if (!token || !getCleaningJobByToken(token)) return { error: "notFound" as const };

  const parsed = parsePhotoPayload(formData.get("photos"));
  if (!parsed.ok) return { error: parsed.reason };
  if (!parsed.photos.length) return { error: "empty" as const };

  addCleaningPhotos(
    token,
    parsed.photos.map((photo) => ({ ...photo, kind })),
  );
  revalidateCleaning();
}

export async function reportCleaningIssueAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  const kind = String(formData.get("kind") ?? "repair") as CleaningIssueKind;
  if (!token || !text) return { error: "empty" as const };
  if (!CLEANING_ISSUE_KINDS.includes(kind)) return { error: "kind" as const };

  const job = getCleaningJobByToken(token);
  if (!job) return { error: "notFound" as const };

  const updated = reportCleaningIssue({
    token,
    kind,
    text: text.slice(0, 2000),
    convert: String(formData.get("convert") ?? "") === "on",
    reporterName: job.cleaner?.contactName ?? "Städpersonal",
  });

  if (kind === "damage") {
    const dict = await getDictionary(getOrganizationLocale(updated.organizationId));
    pushNotification({
      organizationId: updated.organizationId,
      kind: "cleaning_damage",
      title: dict.notifications.cleaningDamage,
      body: `${updated.property.name} · ${text.slice(0, 80)}`,
      href: `/app/cleaning/${updated.id}`,
    });
  }
  revalidateCleaning();
}
