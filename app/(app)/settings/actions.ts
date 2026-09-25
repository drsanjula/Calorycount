"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/app/profileActions";
import { GOAL_NOTE_MAX, TARGET_META } from "@/components/settings/targetMeta";
import { db } from "@/lib/supabase";
import { TARGET_KEYS } from "@/lib/targets";

// A number within the target's bounds, or null for "reset to auto".
const OverrideSchema = z
  .object({ key: z.enum(TARGET_KEYS), value: z.number().finite().nullable() })
  .superRefine(({ key, value }, ctx) => {
    if (value === null) return;
    const { label, unit, min, max } = TARGET_META[key];
    if (value < min || value > max) {
      ctx.addIssue({ code: "custom", path: ["value"], message: `${label} must be between ${min} and ${max} ${unit}` });
    }
  });

const GoalNoteSchema = z.string().trim().max(GOAL_NOTE_MAX, `Keep it under ${GOAL_NOTE_MAX} characters`);
const ToneSchema = z.enum(["blunt", "gentle"]);
const PhotosSchema = z.boolean();

async function updateProfile(patch: Record<string, unknown>): Promise<ActionResult> {
  const { error } = await db().from("profile").update(patch).eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? "Invalid input";

export async function setTargetOverride(input: { key: string; value: number | null }): Promise<ActionResult> {
  const parsed = OverrideSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  return updateProfile({ [`${parsed.data.key}_override`]: parsed.data.value });
}

export async function saveGoalNote(note: string): Promise<ActionResult> {
  const parsed = GoalNoteSchema.safeParse(note);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  return updateProfile({ goal_note: parsed.data || null });
}

export async function setReviewTone(tone: string): Promise<ActionResult> {
  const parsed = ToneSchema.safeParse(tone);
  if (!parsed.success) return { ok: false, error: "Invalid tone" };
  return updateProfile({ review_tone: parsed.data });
}

export async function setSaveCameraPhotos(on: boolean): Promise<ActionResult> {
  const parsed = PhotosSchema.safeParse(on);
  if (!parsed.success) return { ok: false, error: "Invalid value" };
  return updateProfile({ save_camera_photos: parsed.data });
}
