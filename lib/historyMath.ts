/**
 * Pure History aggregation: per-day rows, range averages and chart ticks.
 * No I/O, so it is unit-tested directly; `lib/history.ts` feeds it from the DB.
 */
import { average, dayStatus, EMPTY_TOTALS, sumTotals, type DayStatus } from "./nutrition";
import type { Totals } from "./schemas";
import { addDays, dateRange } from "./time";

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

/** `?range=` value → 7 / 30 / 90; anything else falls back to 7. */
export function parseRange(v: string | string[] | undefined): Range {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return (RANGES as readonly number[]).includes(n) ? (n as Range) : 7;
}

/** Inclusive dates today−(n−1) … today. */
export function rangeDates(today: string, n: number): string[] {
  return dateRange(addDays(today, -(n - 1)), today);
}

export interface DayRow {
  date: string;
  mealCount: number;
  totals: Totals;
  /** Calorie limit the day is judged against; null when neither a snapshot nor live targets exist. */
  limit: number | null;
  /** "live" = no snapshot for that day, so the current limit stands in. */
  limitSource: "snapshot" | "live" | null;
  status: DayStatus | null;
}

type MealLike = { log_date: string } & Partial<Record<keyof Totals, number>>;

export function buildDays(
  dates: readonly string[],
  meals: readonly MealLike[],
  snapshotKcal: ReadonlyMap<string, number>,
  liveLimit: number | null,
): DayRow[] {
  const byDate = new Map<string, MealLike[]>();
  for (const m of meals) byDate.set(m.log_date, [...(byDate.get(m.log_date) ?? []), m]);

  return dates.map((date) => {
    const dayMeals = byDate.get(date) ?? [];
    const snap = snapshotKcal.get(date);
    const hasMeals = dayMeals.length > 0;
    // Days without meals still carry their snapshot limit for the chart line.
    const limit = snap ?? (hasMeals ? liveLimit : null);
    const limitSource = snap !== undefined ? "snapshot" : limit !== null ? "live" : null;
    const totals = hasMeals ? sumTotals(dayMeals) : { ...EMPTY_TOTALS };
    return {
      date,
      mealCount: dayMeals.length,
      totals,
      limit,
      limitSource,
      status: hasMeals && limit !== null ? dayStatus(totals.kcal, limit) : null,
    };
  });
}

export interface ChartPoint {
  date: string;
  /** Null on days without meals, so no bar is drawn. */
  kcal: number | null;
  limit: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  weight_kg: number | null;
}

export interface RangeSummary {
  loggedDays: number;
  onTargetDays: number;
  avgKcal: number;
  avgProtein: number;
}

/**
 * Averages only over days that have meals. `inProgress` (today) is left out:
 * a half-logged day would always read as "under" and drag the averages down.
 */
export function summarize(days: readonly DayRow[], inProgress?: string): RangeSummary {
  const logged = days.filter((d) => d.mealCount > 0 && d.date !== inProgress);
  return {
    loggedDays: logged.length,
    onTargetDays: logged.filter((d) => d.status === "on_target").length,
    avgKcal: average(logged.map((d) => d.totals.kcal)),
    avgProtein: average(logged.map((d) => d.totals.protein_g)),
  };
}

/** Last weight logged on each date (multiple logs a day collapse to the latest). */
export function weightByDate(weights: readonly { log_date: string; logged_at: string; weight_kg: number }[]) {
  const out = new Map<string, number>();
  const sorted = [...weights].sort((a, b) => a.logged_at.localeCompare(b.logged_at));
  for (const w of sorted) out.set(w.log_date, w.weight_kg);
  return out;
}

/**
 * X-axis ticks: every day for 7, otherwise every 7th (30) or 15th (90) day,
 * counted back from today so the latest day is always labelled.
 */
export function chartTicks(dates: readonly string[], range: Range): string[] {
  const step = range === 7 ? 1 : range === 30 ? 7 : 15;
  const out: string[] = [];
  for (let i = dates.length - 1; i >= 0; i -= step) out.unshift(dates[i]);
  return out;
}
