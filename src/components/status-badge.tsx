import { HEALTH_LABEL, PRIORITY_LABEL, STATUS_LABEL } from "@/lib/labels";
import { HEALTH_CLASS, PRIORITY_CLASS, STATUS_CLASS } from "@/lib/status";
import type { CasePriority, CaseStatus, PropertyHealth } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_CLASS[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: CasePriority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        PRIORITY_CLASS[priority],
      )}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function HealthBadge({ health }: { health: PropertyHealth }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        HEALTH_CLASS[health],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {HEALTH_LABEL[health]}
    </span>
  );
}
