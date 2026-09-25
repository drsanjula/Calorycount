import type { TargetKey } from "@/lib/targets";

/** Display info and allowed override range for each target (shared by the editor and the server action). */
export const TARGET_META: Record<TargetKey, { label: string; unit: string; min: number; max: number; step: number; color: string }> = {
  kcal: { label: "Calories", unit: "kcal", min: 800, max: 6000, step: 10, color: "var(--color-flame)" },
  protein_g: { label: "Protein", unit: "g", min: 10, max: 400, step: 1, color: "var(--color-protein)" },
  carbs_g: { label: "Carbs", unit: "g", min: 0, max: 800, step: 1, color: "var(--color-carbs)" },
  fat_g: { label: "Fat", unit: "g", min: 10, max: 300, step: 1, color: "var(--color-fat)" },
  fiber_g: { label: "Fibre", unit: "g", min: 5, max: 100, step: 1, color: "var(--color-fibre)" },
  sugar_g_max: { label: "Sugar (max)", unit: "g", min: 0, max: 300, step: 1, color: "var(--color-sugar)" },
  sodium_mg_max: { label: "Sodium (max)", unit: "mg", min: 200, max: 10000, step: 50, color: "var(--color-sodium)" },
};

export const GOAL_NOTE_MAX = 500;
