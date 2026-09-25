/**
 * Daily targets. Pure functions only — no I/O — so they are easy to test and
 * can run on both server and client (setup/settings previews).
 */
import { ageOn } from "./time";

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose" | "maintain" | "gain";
export type Pace = 0.25 | 0.5 | 0.75;

export const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const KCAL_FLOOR: Record<Sex, number> = { male: 1500, female: 1200 };
export const KCAL_PER_KG = 7700;
export const SODIUM_MAX_MG = 2000;

export const TARGET_KEYS = [
  "kcal",
  "protein_g",
  "carbs_g",
  "fat_g",
  "fiber_g",
  "sugar_g_max",
  "sodium_mg_max",
] as const;
export type TargetKey = (typeof TARGET_KEYS)[number];

export type Overrides = Partial<Record<TargetKey, number | null>>;

export interface BodyProfile {
  date_of_birth: string;
  sex: Sex;
  height_cm: number;
  activity_level: ActivityLevel;
  goal: Goal;
  pace_kg_per_week: number | null;
}

export type TargetSource = "auto" | "custom";

/** Snapshot stored in `daily_targets.targets`. */
export interface TargetsSnapshot {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g_max: number;
  sodium_mg_max: number;
  sources: Record<TargetKey, TargetSource>;
  bmr: number;
  tdee: number;
  weight_kg: number;
  age: number;
  /** True when the calculated limit was raised to the safe minimum. */
  floored: boolean;
}

export const roundKcal = (n: number) => Math.round(n / 10) * 10;
export const roundG = (n: number) => Math.round(n);

export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function tdee(bmrValue: number, activity: ActivityLevel): number {
  return bmrValue * ACTIVITY_MULTIPLIER[activity];
}

export function calorieLimit(
  tdeeValue: number,
  goal: Goal,
  pace: number | null,
  sex: Sex,
): { kcal: number; floored: boolean } {
  const dailyDelta = ((pace ?? 0) * KCAL_PER_KG) / 7;
  const raw = goal === "lose" ? tdeeValue - dailyDelta : goal === "gain" ? tdeeValue + dailyDelta : tdeeValue;
  const floor = KCAL_FLOOR[sex];
  return raw < floor ? { kcal: floor, floored: true } : { kcal: raw, floored: false };
}

/** Macro targets derived from a calorie limit. Unrounded. */
export function macroTargets(
  kcal: number,
  weightKg: number,
  goal: Goal,
  fixed: { protein_g?: number; fat_g?: number } = {},
) {
  const protein_g = fixed.protein_g ?? weightKg * (goal === "lose" ? 1.8 : 1.6);
  const fat_g = fixed.fat_g ?? (kcal * 0.25) / 9;
  const carbs_g = Math.max(0, (kcal - protein_g * 4 - fat_g * 9) / 4);
  return {
    protein_g,
    fat_g,
    carbs_g,
    fiber_g: (kcal / 1000) * 14,
    sugar_g_max: (kcal * 0.1) / 4,
    sodium_mg_max: SODIUM_MAX_MG,
  };
}

const isSet = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v);

/**
 * Effective targets = override if set, otherwise calculated. Macros are derived
 * from the effective kcal (so a kcal override cascades), and carbs fill the
 * kcal left after the effective protein and fat.
 */
export function computeTargets(
  profile: BodyProfile,
  weightKg: number,
  overrides: Overrides,
  onDate: string,
): TargetsSnapshot {
  const age = ageOn(profile.date_of_birth, onDate);
  const b = bmr(profile.sex, weightKg, profile.height_cm, age);
  const t = tdee(b, profile.activity_level);
  const limit = calorieLimit(t, profile.goal, profile.goal === "maintain" ? null : profile.pace_kg_per_week, profile.sex);

  const kcal = isSet(overrides.kcal) ? overrides.kcal : limit.kcal;
  const macros = macroTargets(kcal, weightKg, profile.goal, {
    protein_g: isSet(overrides.protein_g) ? overrides.protein_g : undefined,
    fat_g: isSet(overrides.fat_g) ? overrides.fat_g : undefined,
  });

  const pick = (key: Exclude<TargetKey, "kcal">) => (isSet(overrides[key]) ? (overrides[key] as number) : macros[key]);

  const sources = Object.fromEntries(
    TARGET_KEYS.map((k) => [k, isSet(overrides[k]) ? "custom" : "auto"]),
  ) as Record<TargetKey, TargetSource>;

  return {
    kcal: roundKcal(kcal),
    protein_g: roundG(pick("protein_g")),
    carbs_g: roundG(pick("carbs_g")),
    fat_g: roundG(pick("fat_g")),
    fiber_g: roundG(pick("fiber_g")),
    sugar_g_max: roundG(pick("sugar_g_max")),
    sodium_mg_max: roundG(pick("sodium_mg_max")),
    sources,
    bmr: roundKcal(b),
    tdee: roundKcal(t),
    weight_kg: weightKg,
    age,
    floored: !isSet(overrides.kcal) && limit.floored,
  };
}
