import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { StatusPill } from "@/components/history/parts";
import { ChevronLeft } from "@/components/icons";
import { MealItemRow } from "@/components/MealItemRow";
import { NutrientStrip } from "@/components/NutrientStrip";
import { ReviewCard } from "@/components/ReviewCard";
import { Bar, Card, fmt, fmtKcal, OVER_AT } from "@/components/ui";
import { getReview, getSnapshot, liveTargets, mealsOn, today, tz } from "@/lib/data";
import { dayStatus, sumTotals } from "@/lib/nutrition";
import type { Totals } from "@/lib/schemas";
import type { TargetsSnapshot } from "@/lib/targets";
import { formatDay, formatTime } from "@/lib/time";

const DateParam = z.iso.date();

const ROWS: { label: string; actual: keyof Totals; target: keyof TargetsSnapshot; unit: string; color: string }[] = [
  { label: "Calories", actual: "kcal", target: "kcal", unit: "kcal", color: "var(--color-flame)" },
  { label: "Protein", actual: "protein_g", target: "protein_g", unit: "g", color: "var(--color-protein)" },
  { label: "Carbs", actual: "carbs_g", target: "carbs_g", unit: "g", color: "var(--color-carbs)" },
  { label: "Fat", actual: "fat_g", target: "fat_g", unit: "g", color: "var(--color-fat)" },
  { label: "Fibre", actual: "fiber_g", target: "fiber_g", unit: "g", color: "var(--color-fibre)" },
  { label: "Sugar (max)", actual: "sugar_g", target: "sugar_g_max", unit: "g", color: "var(--color-sugar)" },
  { label: "Sodium (max)", actual: "sodium_mg", target: "sodium_mg_max", unit: "mg", color: "var(--color-sodium)" },
];

export default async function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const parsed = DateParam.safeParse((await params).date);
  if (!parsed.success || parsed.data > today()) notFound();
  const date = parsed.data;

  const [meals, snapshot, review] = await Promise.all([mealsOn(date), getSnapshot(date), getReview(date)]);
  // Fall back to current targets only when the day has meals but no snapshot.
  const targets = snapshot ?? (meals.length > 0 ? await liveTargets() : null);
  const totals = sumTotals(meals);

  return (
    <div className="space-y-3">
      <Link href="/history" className="btn-ghost -ml-1 pt-2">
        <ChevronLeft className="h-4 w-4" /> History
      </Link>
      <header className="flex items-end justify-between gap-3">
        <h1 className="h-display">{formatDay(date)}</h1>
        {targets && meals.length > 0 && <StatusPill status={dayStatus(totals.kcal, targets.kcal)} />}
      </header>

      {meals.length === 0 ? (
        <Card className="py-8 text-center text-muted">Nothing logged on this day.</Card>
      ) : (
        <>
          <Card>
            <NutrientStrip totals={totals} />
          </Card>

          {targets && (
            <Card>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold">Targets vs actual</h2>
                {!snapshot && <span className="text-xs text-muted">No snapshot · current targets</span>}
              </div>
              <ul className="mt-2 space-y-2.5">
                {ROWS.map((r) => {
                  const actual = totals[r.actual];
                  const target = targets[r.target] as number;
                  const show = r.actual === "kcal" ? fmtKcal : (n: number) => fmt(n);
                  return (
                    <li key={r.label}>
                      <div className="mb-1 flex items-baseline justify-between text-sm">
                        <span>{r.label}</span>
                        <span className="tabular-nums">
                          <b>{show(actual)}</b>
                          <span className="text-muted">
                            {" "}
                            / {show(target)} {r.unit}
                          </span>
                        </span>
                      </div>
                      <Bar value={actual} target={target} color={r.color} overAt={OVER_AT[r.actual]} />
                    </li>
                  );
                })}
              </ul>
              {snapshot && (
                <p className="mt-3 text-xs text-muted">
                  BMR {fmtKcal(snapshot.bmr)} · Maintenance {fmtKcal(snapshot.tdee)} · Weight {fmt(snapshot.weight_kg, 1)} kg
                </p>
              )}
            </Card>
          )}

          {review && <ReviewCard review={review} />}

          {meals.map((m) => (
            <Card key={m.id}>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold capitalize">{m.meal_label}</h2>
                <span className="text-sm text-muted">
                  {formatTime(m.eaten_at, tz())} · <b className="text-ink">{fmtKcal(m.kcal)} kcal</b>
                </span>
              </div>
              <ul className="divide-y divide-line">
                {m.items.map((it, i) => (
                  <MealItemRow key={i} item={it} />
                ))}
              </ul>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
