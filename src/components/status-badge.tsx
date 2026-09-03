import type { Dictionary } from "@/i18n/messages";
import { healthLabel, priorityLabel, statusLabel } from "@/lib/labels";
import { HEALTH_CLASS, PRIORITY_CLASS, STATUS_CLASS } from "@/lib/status";
import type { CasePriority, CaseStatus, PropertyHealth } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  dict,
}: {
  status: CaseStatus;
  dict: Dictionary;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_CLASS[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel(dict, status)}
    </span>
  );
}

export function PriorityBadge({
  priority,
  dict,
}: {
  priority: CasePriority;
  dict: Dictionary;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        PRIORITY_CLASS[priority],
      )}
    >
      {priorityLabel(dict, priority)}
    </span>
  );
}

export function HealthBadge({
  health,
  dict,
}: {
  health: PropertyHealth;
  dict: Dictionary;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        HEALTH_CLASS[health],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {healthLabel(dict, health)}
    </span>
  );
}
