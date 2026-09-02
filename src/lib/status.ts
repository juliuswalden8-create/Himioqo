import type { CasePriority, CaseStatus, PropertyHealth } from "@/lib/types";

export const STATUS_CLASS: Record<CaseStatus, string> = {
  new: "bg-status-new/10 text-status-new",
  waiting: "bg-status-waiting/10 text-status-waiting",
  assigned: "bg-status-assigned/10 text-status-assigned",
  in_progress: "bg-status-progress/15 text-status-progress",
  resolved: "bg-status-done/10 text-status-done",
};

export const PRIORITY_CLASS: Record<CasePriority, string> = {
  low: "bg-navy-50 text-navy-600",
  soon: "bg-status-waiting/10 text-status-waiting",
  urgent: "bg-status-urgent/10 text-status-urgent",
};

export const HEALTH_CLASS: Record<PropertyHealth, string> = {
  good: "bg-status-done/10 text-status-done",
  attention: "bg-status-waiting/10 text-status-waiting",
  critical: "bg-status-urgent/10 text-status-urgent",
};

export const HEALTH_DOT: Record<PropertyHealth, string> = {
  good: "bg-status-done",
  attention: "bg-status-waiting",
  critical: "bg-status-urgent",
};
