import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { dateOf, ensureSnapshot, liveTargets, tz } from "@/lib/data";
import { sumItems } from "@/lib/nutrition";
import { SaveMealSchema } from "@/lib/schemas";
import { db } from "@/lib/supabase";
import { hourInTz, mealLabelForHour } from "@/lib/time";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = SaveMealSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid meal" }, { status: 400 });
  const m = parsed.data;

  const now = new Date();
  const logDate = dateOf(now);
  const totals = sumItems(m.items);

  try {
    // Snapshot first, so the day's targets reflect the state at its first meal.
    const targets = await liveTargets();
    if (!targets) return NextResponse.json({ error: "Finish setup first" }, { status: 409 });
    await ensureSnapshot(logDate, targets);

    const { data, error } = await db()
      .from("meals")
      .insert({
        eaten_at: now.toISOString(),
        log_date: logDate,
        meal_label: mealLabelForHour(hourInTz(now, tz())),
        input_text: m.input_text,
        had_image: m.had_image,
        items: m.items,
        ...totals,
        confidence: m.confidence,
        ai_notes: m.ai_notes,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    revalidatePath("/");
    return NextResponse.json({ id: data.id });
  } catch (e) {
    console.error("save meal failed", e);
    return NextResponse.json({ error: "Couldn't save the meal. Try again." }, { status: 500 });
  }
}
