"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  addCleaner,
  addCleaningPhotos,
  approveCleaningJob,
  cleanerMayAccessJob,
  createCleaningJob,
  getCleaningJob,
  getCleaningJobByToken,
  getOrganization,
  getOrganizationLocale,
  pushNotification,
  reportCleaningIssue,
  returnCleaningJob,
  recordCleaningMinutes,
  toggleCleaningItem,
  updateCleaningStatus,
  upsertCleaningSchedule,
} from "@/lib/data/store";
import { sendCleaningCompleteNotice } from "@/lib/email/send";
import { getSession, requireHostSession } from "@/lib/session";
import {
  CLEANING_ISSUE_KINDS,
  type CleaningIssueKind,
  type CleaningStatus,
} from "@/lib/types";
import { parsePhotoPayload } from "@/lib/uploads";

function revalidateCleaning() {
  revalidatePath("/", "layout");
}

async function resolveCleanerJob(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const jobId = String(formData.get("jobId") ?? "");
  if (token) {
    const job = getCleaningJobByToken(token);
    return job ? { job, token: job.accessToken } : null;
  }
  const session = await getSession();
  if (!session || session.role !== "cleaner" || !jobId) return null;
  const job = getCleaningJob(session.organizationId, jobId);
  if (!job || !cleanerMayAccessJob(session.membership, job)) return null;
  return { job, token: job.accessToken };
}

export async function createCleaningJobAction(formData: FormData) {
  const session = await requireHostSession();
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
  const session = await requireHostSession();
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
  const session = await requireHostSession();
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
  const session = await requireHostSession();
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
  const session = await requireHostSession();
  returnCleaningJob(
    session.organizationId,
    String(formData.get("jobId") ?? ""),
    String(formData.get("comment") ?? ""),
  );
  revalidateCleaning();
}

export async function cleanerStatusAction(formData: FormData) {
  const resolved = await resolveCleanerJob(formData);
  if (!resolved) return { error: "notFound" as const };
  const status = String(formData.get("status") ?? "") as CleaningStatus;
  if (!["accepted", "in_progress", "completed"].includes(status)) return;

  const job = updateCleaningStatus(resolved.token, status, true);
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
  const resolved = await resolveCleanerJob(formData);
  const itemId = String(formData.get("itemId") ?? "");
  const done = String(formData.get("done") ?? "") === "true";
  if (!resolved || !itemId) return;
  toggleCleaningItem(resolved.token, itemId, done);
  revalidateCleaning();
}

export async function addCleaningPhotosAction(formData: FormData) {
  const resolved = await resolveCleanerJob(formData);
  if (!resolved) return { error: "notFound" as const };
  const kind = String(formData.get("kind") ?? "after") === "before" ? "before" : "after";

  const parsed = parsePhotoPayload(formData.get("photos"));
  if (!parsed.ok) return { error: parsed.reason };
  if (!parsed.photos.length) return { error: "empty" as const };

  addCleaningPhotos(
    resolved.token,
    parsed.photos.map((photo) => ({ ...photo, kind })),
  );
  revalidateCleaning();
}

export async function recordCleaningMinutesAction(formData: FormData) {
  const resolved = await resolveCleanerJob(formData);
  if (!resolved) return { error: "notFound" as const };
  const minutes = Number(formData.get("minutes") ?? "");
  try {
    recordCleaningMinutes(resolved.token, minutes);
  } catch {
    return { error: "generic" as const };
  }
  revalidateCleaning();
}

export async function reportCleaningIssueAction(formData: FormData) {
  const resolved = await resolveCleanerJob(formData);
  const text = String(formData.get("text") ?? "").trim();
  const kind = String(formData.get("kind") ?? "repair") as CleaningIssueKind;
  if (!resolved || !text) return { error: "empty" as const };
  if (!CLEANING_ISSUE_KINDS.includes(kind)) return { error: "kind" as const };

  const job = resolved.job;

  const updated = reportCleaningIssue({
    token: resolved.token,
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
