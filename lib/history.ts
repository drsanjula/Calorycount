import "server-only";
import { latestWeight, liveTargets, mealsInRange, snapshotsInRange, today, weightsInRange } from "./data";
import { buildDays, rangeDates, summarize, weightByDate, type ChartPoint, type DayRow, type Range, type RangeSummary } from "./historyMath";
import type { TargetsSnapshot } from "./targets";

export interface History {
  range: Range;
  dates: string[];
  days: DayRow[];
  points: ChartPoint[];
  summary: RangeSummary;
  live: TargetsSnapshot | null;
  currentWeight: number | null;
  hasWeights: boolean;
}

/** Everything the History dashboard needs for the last `range` days (Colombo time). */
export async function loadHistory(range: Range): Promise<History> {
  const dates = rangeDates(today(), range);
  const start = dates[0];
  const end = dates[dates.length - 1];
  const [meals, snaps, weights, live, currentWeight] = await Promise.all([
    mealsInRange(start, end),
    snapshotsInRange(start, end),
    weightsInRange(start, end),
    liveTargets(),
    latestWeight(),
  ]);

  const snapKcal = new Map([...snaps].map(([d, s]) => [d, s.kcal]));
  const days = buildDays(dates, meals, snapKcal, live?.kcal ?? null);
  const weightOn = weightByDate(weights);

  const points = days.map((d): ChartPoint => {
    const logged = d.mealCount > 0;
    return {
      date: d.date,
      kcal: logged ? d.totals.kcal : null,
      limit: d.limit,
      protein_g: logged ? d.totals.protein_g : null,
      carbs_g: logged ? d.totals.carbs_g : null,
      fat_g: logged ? d.totals.fat_g : null,
      weight_kg: weightOn.get(d.date) ?? null,
    };
  });

  return {
    range,
    dates,
    days,
    points,
    summary: summarize(days, today()),
    live,
    currentWeight,
    hasWeights: weightOn.size > 0,
  };
}
