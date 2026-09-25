import type { Totals } from "@/lib/schemas";
import { fmt, fmtKcal } from "./ui";

const CELLS: { key: keyof Totals; label: string; unit: string; color: string }[] = [
  { key: "kcal", label: "kcal", unit: "", color: "var(--color-flame)" },
  { key: "protein_g", label: "Protein", unit: "g", color: "var(--color-protein)" },
  { key: "carbs_g", label: "Carbs", unit: "g", color: "var(--color-carbs)" },
  { key: "fat_g", label: "Fat", unit: "g", color: "var(--color-fat)" },
  { key: "fiber_g", label: "Fibre", unit: "g", color: "var(--color-fibre)" },
  { key: "sugar_g", label: "Sugar", unit: "g", color: "var(--color-sugar)" },
  { key: "sodium_mg", label: "Sodium", unit: "mg", color: "var(--color-sodium)" },
];

export function NutrientStrip({ totals }: { totals: Totals }) {
  return (
    <div className="grid grid-cols-4 gap-y-3 sm:grid-cols-7">
      {CELLS.map((c) => (
        <div key={c.key} className="flex flex-col items-center border-line text-center">
          <span className="mb-1 h-1.5 w-6 rounded-full" style={{ background: c.color }} />
          <span className="text-lg font-bold leading-tight">
            {c.key === "kcal" ? fmtKcal(totals.kcal) : fmt(totals[c.key])}
            {c.unit && <span className="text-sm font-semibold">{c.unit}</span>}
          </span>
          <span className="text-xs text-muted">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
