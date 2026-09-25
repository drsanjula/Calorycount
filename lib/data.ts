import "server-only";
import { env } from "./env";
import { sumTotals } from "./nutrition";
import type { Confidence, MealItem, ReviewOutput, Totals } from "./schemas";
import { db } from "./supabase";
import { computeTargets, TARGET_KEYS, type BodyProfile, type Overrides, type TargetKey, type TargetsSnapshot } from "./targets";
import { dateInTz, todayIn, yesterdayIn, type MealLabel } from "./time";

export const tz = () => env().APP_TIMEZONE;
export const today = () => todayIn(tz());
export const yesterday = () => yesterdayIn(tz());
export const dateOf = (d: Date) => dateInTz(d, tz());

export interface ProfileRow {
  date_of_birth: string | null;
  sex: BodyProfile["sex"] | null;
  height_cm: number | null;
  activity_level: BodyProfile["activity_level"] | null;
  goal: BodyProfile["goal"] | null;
  pace_kg_per_week: number | null;
  goal_note: string | null;
  review_tone: "blunt" | "gentle";
  save_camera_photos: boolean;
  onboarded: boolean;
  overrides: Overrides;
}

export interface MealRow extends Totals {
  id: string;
  eaten_at: string;
  log_date: string;
  meal_label: MealLabel;
  input_text: string | null;
  had_image: boolean;
  items: MealItem[];
  confidence: Confidence;
  ai_notes: string | null;
}

export interface ReviewRow extends ReviewOutput {
  log_date: string;
  totals: Totals;
}

export interface WeightRow {
  logged_at: string;
  log_date: string;
  weight_kg: number;
}

const num = (v: unknown): number | null => (v === null || v === undefined || v === "" ? null : Number(v));

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`${what}: ${error?.message ?? "unknown error"}`);
}

export async function getProfile(): Promise<ProfileRow> {
  const { data, error } = await db().from("profile").select("*").eq("id", 1).maybeSingle();
  if (error) fail("load profile", error);
  const r = (data ?? {}) as Record<string, unknown>;
  const overrides = Object.fromEntries(
    TARGET_KEYS.map((k) => [k, num(r[`${k}_override`])]),
  ) as Record<TargetKey, number | null>;
  return {
    date_of_birth: (r.date_of_birth as string | null) ?? null,
    sex: (r.sex as ProfileRow["sex"]) ?? null,
    height_cm: num(r.height_cm),
    activity_level: (r.activity_level as ProfileRow["activity_level"]) ?? null,
    goal: (r.goal as ProfileRow["goal"]) ?? null,
    pace_kg_per_week: num(r.pace_kg_per_week),
    goal_note: (r.goal_note as string | null) ?? null,
    review_tone: r.review_tone === "gentle" ? "gentle" : "blunt",
    save_camera_photos: r.save_camera_photos !== false,
    onboarded: r.onboarded === true,
    overrides,
  };
}

export function bodyProfile(p: ProfileRow): BodyProfile | null {
  if (!p.date_of_birth || !p.sex || !p.height_cm || !p.activity_level || !p.goal) return null;
  return {
    date_of_birth: p.date_of_birth,
    sex: p.sex,
    height_cm: p.height_cm,
    activity_level: p.activity_level,
    goal: p.goal,
    pace_kg_per_week: p.pace_kg_per_week,
  };
}

export async function latestWeight(): Promise<number | null> {
  const { data, error } = await db()
    .from("weight_logs")
    .select("weight_kg")
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) fail("load weight", error);
  return data ? Number(data.weight_kg) : null;
}

export async function addWeight(weightKg: number): Promise<void> {
  const now = new Date();
  const { error } = await db()
    .from("weight_logs")
    .insert({ logged_at: now.toISOString(), log_date: dateOf(now), weight_kg: weightKg });
  if (error) fail("save weight", error);
}

/** Current targets from the profile, latest weight and overrides. */
export async function liveTargets(profile?: ProfileRow): Promise<TargetsSnapshot | null> {
  const [p, w] = await Promise.all([profile ?? getProfile(), latestWeight()]);
  const body = bodyProfile(p);
  if (!body || w === null) return null;
  return computeTargets(body, w, p.overrides, today());
}

export async function getSnapshot(date: string): Promise<TargetsSnapshot | null> {
  const { data, error } = await db().from("daily_targets").select("targets").eq("log_date", date).maybeSingle();
  if (error) fail("load targets", error);
  return (data?.targets as TargetsSnapshot | undefined) ?? null;
}

/** Writes the snapshot for `date` if none exists yet (first meal of the day). */
export async function ensureSnapshot(date: string, targets: TargetsSnapshot): Promise<void> {
  const { error } = await db()
    .from("daily_targets")
    .upsert({ log_date: date, targets }, { onConflict: "log_date", ignoreDuplicates: true });
  if (error) fail("save targets snapshot", error);
}

export async function snapshotsInRange(start: string, end: string): Promise<Map<string, TargetsSnapshot>> {
  const { data, error } = await db()
    .from("daily_targets")
    .select("log_date, targets")
    .gte("log_date", start)
    .lte("log_date", end);
  if (error) fail("load targets", error);
  return new Map((data ?? []).map((r) => [r.log_date as string, r.targets as TargetsSnapshot]));
}

function toMeal(r: Record<string, unknown>): MealRow {
  return {
    id: r.id as string,
    eaten_at: r.eaten_at as string,
    log_date: r.log_date as string,
    meal_label: r.meal_label as MealLabel,
    input_text: (r.input_text as string | null) ?? null,
    had_image: r.had_image === true,
    items: (r.items as MealItem[]) ?? [],
    confidence: r.confidence as Confidence,
    ai_notes: (r.ai_notes as string | null) ?? null,
    ...sumTotals([r as Partial<Record<keyof Totals, number>>]),
  };
}

export async function mealsInRange(start: string, end: string): Promise<MealRow[]> {
  const { data, error } = await db()
    .from("meals")
    .select("*")
    .gte("log_date", start)
    .lte("log_date", end)
    .order("eaten_at", { ascending: true });
  if (error) fail("load meals", error);
  return (data ?? []).map(toMeal);
}

export const mealsOn = (date: string) => mealsInRange(date, date);

export async function weightsInRange(start: string, end: string): Promise<WeightRow[]> {
  const { data, error } = await db()
    .from("weight_logs")
    .select("logged_at, log_date, weight_kg")
    .gte("log_date", start)
    .lte("log_date", end)
    .order("logged_at", { ascending: true });
  if (error) fail("load weights", error);
  return (data ?? []).map((r) => ({ logged_at: r.logged_at, log_date: r.log_date, weight_kg: Number(r.weight_kg) }));
}

export async function getReview(date: string): Promise<ReviewRow | null> {
  const { data, error } = await db().from("daily_reviews").select("*").eq("log_date", date).maybeSingle();
  if (error) fail("load review", error);
  if (!data) return null;
  return {
    log_date: data.log_date,
    score: data.score,
    summary: data.summary,
    wins: data.wins ?? [],
    improvements: data.improvements ?? [],
    tomorrow_tip: data.tomorrow_tip,
    totals: data.totals,
  };
}

export async function hasMealsOn(date: string): Promise<boolean> {
  const { count, error } = await db()
    .from("meals")
    .select("id", { count: "exact", head: true })
    .eq("log_date", date);
  if (error) fail("count meals", error);
  return (count ?? 0) > 0;
}
