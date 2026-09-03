import type { Dictionary } from "@/i18n/messages";
import type {
  CaseCategory,
  CasePriority,
  CaseStatus,
  MessageAuthor,
  PropertyHealth,
  PropertyType,
} from "@/lib/types";

export function statusLabel(dict: Dictionary, status: CaseStatus) {
  return dict.status.case[status] ?? status;
}

export function priorityLabel(dict: Dictionary, priority: CasePriority) {
  return dict.status.priority[priority] ?? priority;
}

export function healthLabel(dict: Dictionary, health: PropertyHealth) {
  return dict.status.health[health] ?? health;
}

export function propertyTypeLabel(dict: Dictionary, type: PropertyType) {
  return dict.status.propertyType[type] ?? type;
}

export function authorLabel(dict: Dictionary, author: MessageAuthor) {
  return dict.status.author[author] ?? author;
}

export function categoryLabel(dict: Dictionary, category: CaseCategory) {
  return dict.report.categories[category] ?? category;
}
