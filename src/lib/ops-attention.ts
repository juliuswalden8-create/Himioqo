import { isToday, parseISO, startOfDay } from "date-fns";
import { OPEN_STATUSES } from "@/lib/types";
import type { CaseStatus, CleaningStatus } from "@/lib/types";

/** Open cases older than this, or past dueAt, count as overdue. */
export const CASE_OVERDUE_MS = 48 * 60 * 60 * 1000;

const CLEANING_DONE: CleaningStatus[] = ["completed", "approved"];

export function caseIsOpen(status: CaseStatus) {
  return OPEN_STATUSES.includes(status);
}

export function caseIsOverdue(item: {
  status: CaseStatus;
  createdAt: string;
  dueAt?: string;
}) {
  if (!caseIsOpen(item.status)) return false;
  if (item.dueAt) return Date.parse(item.dueAt) < Date.now();
  return Date.now() - Date.parse(item.createdAt) >= CASE_OVERDUE_MS;
}

export function caseAttentionRank(item: {
  status: CaseStatus;
  priority: string;
  createdAt: string;
  dueAt?: string;
}) {
  if (caseIsOpen(item.status) && item.priority === "urgent") return 0;
  if (caseIsOverdue(item)) return 1;
  return 2;
}

export function cleaningIsDone(status: CleaningStatus) {
  return CLEANING_DONE.includes(status);
}

export function cleaningBucket(job: { status: CleaningStatus; scheduledAt: string }) {
  if (cleaningIsDone(job.status)) return "done" as const;
  const scheduled = startOfDay(parseISO(job.scheduledAt));
  const today = startOfDay(new Date());
  if (scheduled.getTime() < today.getTime()) return "overdue" as const;
  if (isToday(parseISO(job.scheduledAt))) return "today" as const;
  return "upcoming" as const;
}
