import "server-only";
import { getProfile, getReview, getSnapshot, liveTargets, mealsInRange, tz, weightsInRange, type ReviewRow } from "./data";
import { generateStructured } from "./gemini";
import { average, sumTotals } from "./nutrition";
import { REVIEW_SYSTEM, toneInstruction } from "./prompts";
import { ReviewOutputSchema, type Totals } from "./schemas";
import { db } from "./supabase";
import { addDays, formatTime } from "./time";

export type ReviewResult = { status: "ok"; review: ReviewRow } | { status: "empty" };

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Everything Gemini sees about `date`, kept compact. */
async function buildContext(date: string) {
  const weekStart = addDays(date, -6);
  const [profile, weekMeals, snapshot, weights] = await Promise.all([
    getProfile(),
    mealsInRange(weekStart, date),
    getSnapshot(date),
    weightsInRange(addDays(date, -13), date),
  ]);
  const meals = weekMeals.filter((m) => m.log_date === date);
  if (meals.length === 0) return null;
  const targets = snapshot ?? (await liveTargets(profile));
  const dayTotals = sumTotals(meals);

  // 7-day averages over the days that actually have meals.
  const byDay = new Map<string, typeof weekMeals>();
  for (const m of weekMeals) byDay.set(m.log_date, [...(byDay.get(m.log_date) ?? []), m]);
  const dailyTotals = [...byDay.values()].map((ms) => sumTotals(ms));
  const avg = Object.fromEntries(
    (Object.keys(dayTotals) as (keyof Totals)[]).map((k) => [k, r1(average(dailyTotals.map((t) => t[k])))]),
  ) as Totals;

  return {
    totals: dayTotals,
    context: {
      date,
      profile: {
        goal: profile.goal,
        pace_kg_per_week: profile.goal === "maintain" ? null : profile.pace_kg_per_week,
        goal_note: profile.goal_note,
        review_tone: profile.review_tone,
      },
      targets: targets && {
        kcal_limit: targets.kcal,
        protein_g: targets.protein_g,
        carbs_g: targets.carbs_g,
        fat_g: targets.fat_g,
        fiber_g: targets.fiber_g,
        sugar_g_max: targets.sugar_g_max,
        sodium_mg_max: targets.sodium_mg_max,
        bmr: targets.bmr,
        tdee: targets.tdee,
        weight_kg: targets.weight_kg,
        floored_to_safe_minimum: targets.floored,
        from_snapshot: snapshot !== null,
      },
      meals: meals.map((m) => ({
        label: m.meal_label,
        time: formatTime(m.eaten_at, tz()),
        items: m.items.map((i) => ({
          name: i.name,
          qty: `${i.quantity} ${i.unit}`,
          g: i.grams,
          kcal: i.kcal,
          p: i.protein_g,
          c: i.carbs_g,
          f: i.fat_g,
          fib: i.fiber_g,
          sug: i.sugar_g,
          na_mg: i.sodium_mg,
        })),
        totals: sumTotals([m]),
      })),
      day_totals: dayTotals,
      avg_7d: { logged_days: dailyTotals.length, ...avg },
      weight_trend_14d: weights.map((w) => ({ date: w.log_date, kg: w.weight_kg })),
    },
  };
}

/**
 * Returns the stored review for `date`, generating and storing it first if
 * needed. Idempotent: an existing row never triggers a Gemini call.
 * Throws GeminiError on AI failures.
 */
export async function getOrCreateReview(date: string): Promise<ReviewResult> {
  const existing = await getReview(date);
  if (existing) return { status: "ok", review: existing };

  const built = await buildContext(date);
  if (!built) return { status: "empty" };

  const profile = built.context.profile;
  const out = await generateStructured({
    schema: ReviewOutputSchema,
    system: `${REVIEW_SYSTEM}\n\n${toneInstruction(profile.review_tone)}`,
    parts: [{ text: `Day to review (JSON):\n${JSON.stringify(built.context)}` }],
    thinking: "medium",
  });

  // A concurrent request may have stored one already; keep the first.
  const { error } = await db()
    .from("daily_reviews")
    .upsert({ log_date: date, ...out, totals: built.totals }, { onConflict: "log_date", ignoreDuplicates: true });
  if (error) throw new Error(`save review: ${error.message}`);
  const saved = await getReview(date);
  return { status: "ok", review: saved ?? { log_date: date, ...out, totals: built.totals } };
}
