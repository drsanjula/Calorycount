import { Card, fmt, fmtKcal } from "@/components/ui";
import type { MealRow } from "@/lib/data";
import type { MealLabel } from "@/lib/time";
import { formatTime } from "@/lib/time";

const LABEL: Record<MealLabel, { name: string; chip: string }> = {
  breakfast: { name: "Breakfast", chip: "bg-carbs/20 text-warn" },
  lunch: { name: "Lunch", chip: "bg-brand-soft text-brand" },
  dinner: { name: "Dinner", chip: "bg-limit-soft text-limit" },
  snack: { name: "Snack", chip: "bg-fat/15 text-fat" },
};

/** Today's meals, read-only. */
export function MealList({ meals, tz }: { meals: MealRow[]; tz: string }) {
  return (
    <Card>
      <h2 className="text-lg font-bold">Today&apos;s meals</h2>
      {meals.length === 0 ? (
        <div className="py-6 text-center">
          <p className="font-semibold">Nothing logged yet today</p>
          <p className="mt-1 text-sm text-muted">Snap or describe your first meal to start tracking.</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {meals.map((m) => {
            const l = LABEL[m.meal_label];
            const title = m.items.map((i) => i.name).join(", ") || m.input_text || l.name;
            return (
              <li key={m.id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${l.chip}`} aria-hidden>
                  {l.name[0]}
                </span>
                <div className="w-[4.5rem] shrink-0">
                  <p className="text-sm font-semibold">{l.name}</p>
                  <p className="text-xs text-muted">{formatTime(m.eaten_at, tz)}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted">
                    {fmtKcal(m.kcal)} kcal · <b className="text-protein">P</b> {fmt(m.protein_g)}g <b className="text-carbs">C</b>{" "}
                    {fmt(m.carbs_g)}g <b className="text-fat">F</b> {fmt(m.fat_g)}g
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
