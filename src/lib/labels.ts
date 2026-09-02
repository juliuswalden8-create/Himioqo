import type {
  CaseCategory,
  CasePriority,
  CaseStatus,
  PropertyHealth,
  PropertyType,
} from "@/lib/types";

export const STATUS_LABEL: Record<CaseStatus, string> = {
  new: "Ny",
  waiting: "Väntar på åtgärd",
  assigned: "Hantverkare tilldelad",
  in_progress: "Pågår",
  resolved: "Löst",
};

export const PRIORITY_LABEL: Record<CasePriority, string> = {
  low: "Inte akut",
  soon: "Behöver åtgärdas snart",
  urgent: "Akut",
};

export const CATEGORY_LABEL: Record<CaseCategory, string> = {
  water: "Vatten eller läcka",
  electricity: "El",
  hvac: "Värme eller ventilation",
  appliances: "Vitvaror",
  lock: "Lås eller dörr",
  bathroom: "Badrum",
  kitchen: "Kök",
  furniture: "Skada på möbler",
  internet: "Internet",
  other: "Annat",
};

export const HEALTH_LABEL: Record<PropertyHealth, string> = {
  good: "Allt ser bra ut",
  attention: "Behöver uppmärksamhet",
  critical: "Kräver åtgärd",
};

export const TYPE_LABEL: Record<PropertyType, string> = {
  apartment: "Lägenhet",
  house: "Hus",
  villa: "Villa",
};

export const AUTHOR_LABEL: Record<string, string> = {
  owner: "Förvaltare",
  tenant: "Hyresgäst",
  contractor: "Hantverkare",
  system: "System",
};
