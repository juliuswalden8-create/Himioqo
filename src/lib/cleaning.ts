export const DEFAULT_CHECK_KEYS = [
  "kitchen",
  "bathroom",
  "bedding",
  "towels",
  "supplies",
  "keys",
  "living",
  "bedroom",
  "floors",
  "windows",
  "trash",
  "entrance",
] as const;

export type CheckKey = (typeof DEFAULT_CHECK_KEYS)[number];

export const DEFAULT_CHECK_LABELS: Record<CheckKey, string> = {
  kitchen: "Kök",
  bathroom: "Badrum",
  bedding: "Sängkläder",
  towels: "Handdukar",
  supplies: "Förbrukningsvaror",
  keys: "Nycklar",
  living: "Vardagsrum",
  bedroom: "Sovrum",
  floors: "Golv",
  windows: "Fönster",
  trash: "Sopkärl",
  entrance: "Entré",
};

export function checklistLabelsFromDict(checks: Record<CheckKey, string>): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const key of DEFAULT_CHECK_KEYS) {
    labels[key] = checks[key];
  }
  return labels;
}
