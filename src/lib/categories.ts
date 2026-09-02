import {
  Armchair,
  Bath,
  Droplets,
  KeyRound,
  MoreHorizontal,
  Refrigerator,
  Thermometer,
  UtensilsCrossed,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { CaseCategory } from "@/lib/types";

export const CATEGORY_ICON: Record<CaseCategory, LucideIcon> = {
  water: Droplets,
  electricity: Zap,
  hvac: Thermometer,
  appliances: Refrigerator,
  lock: KeyRound,
  bathroom: Bath,
  kitchen: UtensilsCrossed,
  furniture: Armchair,
  internet: Wifi,
  other: MoreHorizontal,
};
