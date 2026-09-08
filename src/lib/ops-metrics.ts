export type RatioResult = {
  completed: number;
  total: number;
  percent: number | null;
};

export type RatioTone = "empty" | "good" | "watch" | "alert" | "neutral";

/** Never returns 100 when the denominator is 0. */
export function ratioFromCounts(completed: number, total: number): RatioResult {
  const safeCompleted = Math.max(0, completed);
  const safeTotal = Math.max(0, total);
  if (safeTotal <= 0) {
    return { completed: 0, total: 0, percent: null };
  }
  return {
    completed: Math.min(safeCompleted, safeTotal),
    total: safeTotal,
    percent: Math.round((Math.min(safeCompleted, safeTotal) / safeTotal) * 100),
  };
}

export function ratioTone(percent: number | null): RatioTone {
  if (percent === null) return "empty";
  if (percent >= 80) return "good";
  if (percent >= 50) return "watch";
  return "alert";
}

/**
 * Percent change vs the previous period. Both sides must have real volume;
 * otherwise the UI should hide the delta instead of inventing a trend.
 */
export function periodDelta(current: number, previous: number): number | null {
  if (current <= 0 || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function inIsoRange(iso: string, startIso: string, endIso: string) {
  return iso >= startIso && iso < endIso;
}
