import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import type { Dictionary } from "@/i18n/messages";
import type { CasePriority, CaseStatus } from "@/lib/types";

export type AttentionAction = "assign" | "openCase" | "approve" | "openProperty" | "openCleaning";

export type AttentionRowItem = {
  id: string;
  href: string;
  property: string;
  title: string;
  waiting: string;
  assignee: string | null;
  action: AttentionAction;
  priority?: CasePriority;
  status?: CaseStatus;
};

export function AttentionList({
  items,
  dict,
  emptyTitle,
  emptyHelp,
}: {
  items: AttentionRowItem[];
  dict: Dictionary;
  emptyTitle: string;
  emptyHelp: string;
}) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-border bg-white px-5 py-6 shadow-soft">
        <p className="text-sm font-semibold text-navy-800">{emptyTitle}</p>
        <p className="mt-1 text-sm text-navy-600">{emptyHelp}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-white px-5 shadow-soft">
      {items.map((item) => {
        const actionLabel =
          item.action === "assign"
            ? dict.dashboard.assign
            : item.action === "approve"
              ? dict.dashboard.approve
              : item.action === "openProperty"
                ? dict.dashboard.openProperty
                : item.action === "openCleaning"
                  ? dict.cleaning.openChecklist
                  : dict.dashboard.openCase;
        return (
          <li key={item.id} className="relative py-3">
            <Link href={item.href} className="absolute inset-0 z-0 rounded-xl" aria-label={item.title} />
            <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-navy-800">{item.title}</p>
                <p className="mt-0.5 text-sm text-navy-600">
                  {item.property}
                  {item.waiting ? ` · ${item.waiting}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {item.priority ? <PriorityBadge priority={item.priority} dict={dict} /> : null}
                  {item.status ? <StatusBadge status={item.status} dict={dict} /> : null}
                  {item.assignee ? (
                    <span className="text-xs text-navy-600">{item.assignee}</span>
                  ) : (
                    <span className="text-xs font-medium text-status-urgent">{dict.dashboard.unassigned}</span>
                  )}
                </div>
              </div>
              <Button asChild size="sm" variant={item.action === "assign" ? "cta" : "secondary"}>
                <Link href={item.href}>{actionLabel}</Link>
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
