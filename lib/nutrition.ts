import type { MealItem, Totals } from "./schemas";

export const EMPTY_TOTALS: Totals = {
  kcal: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fiber_g: 0,
  sugar_g: 0,
  sodium_mg: 0,
};

const KEYS = Object.keys(EMPTY_TOTALS) as (keyof Totals)[];

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Sum any list of things carrying nutrient fields (meal items or meals). Rounded to 0.1. */
export function sumTotals(rows: ReadonlyArray<Partial<Record<keyof Totals, number | string | null>>>): Totals {
  const out = { ...EMPTY_TOTALS };
  for (const row of rows) {
    for (const k of KEYS) {
      const v = Number(row[k] ?? 0);
      if (Number.isFinite(v)) out[k] += v;
    }
  }
  for (const k of KEYS) out[k] = r1(out[k]);
  return out;
}

export function sumItems(items: readonly MealItem[]): Totals {
  return sumTotals(items);
}

export type DayStatus = "on_target" | "near" | "over" | "under";

/**
 * On target within ±5% of the limit, near within ±15%. Beyond that: "over"
 * when above the limit, "under" when well below it.
 */
export function dayStatus(kcal: number, limit: number): DayStatus {
  if (limit <= 0) return "over";
  const diff = (kcal - limit) / limit;
  if (Math.abs(diff) <= 0.05) return "on_target";
  if (Math.abs(diff) <= 0.15) return "near";
  return diff > 0 ? "over" : "under";
}

/** Percentage 0–100 for progress bars. */
export function pct(value: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, (value / target) * 100));
}

export function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}
