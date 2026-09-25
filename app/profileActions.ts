"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addWeight, latestWeight } from "@/lib/data";
import { BodyStatsSchema, type BodyStatsInput } from "@/lib/schemas";
import { db } from "@/lib/supabase";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

async function writeBodyStats(input: BodyStatsInput, onboard: boolean): Promise<ActionResult> {
  const parsed = BodyStatsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const v = parsed.data;
  const { error } = await db()
    .from("profile")
    .update({
      date_of_birth: v.date_of_birth,
      sex: v.sex,
      height_cm: v.height_cm,
      activity_level: v.activity_level,
      goal: v.goal,
      pace_kg_per_week: v.pace_kg_per_week,
      ...(onboard ? { onboarded: true } : {}),
    })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  const current = await latestWeight();
  if (current === null || Math.abs(current - v.weight_kg) > 1e-9) await addWeight(v.weight_kg);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function completeSetup(input: BodyStatsInput): Promise<ActionResult> {
  const res = await writeBodyStats(input, true);
  if (!res.ok) return res;
  redirect("/");
}

export async function updateBodyStats(input: BodyStatsInput): Promise<ActionResult> {
  return writeBodyStats(input, false);
}
