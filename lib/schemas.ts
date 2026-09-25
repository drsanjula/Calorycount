import { z } from "zod";

const nonNeg = z.number().min(0);

export const MealItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: nonNeg.describe("Amount in the given unit, e.g. 2 for '2 pieces'"),
  unit: z.string().max(60).describe("e.g. 'cup', 'piece', 'g', 'plate'"),
  grams: nonNeg,
  kcal: nonNeg,
  protein_g: nonNeg,
  carbs_g: nonNeg,
  fat_g: nonNeg,
  fiber_g: nonNeg,
  sugar_g: nonNeg,
  sodium_mg: nonNeg,
});
export type MealItem = z.infer<typeof MealItemSchema>;

export const TotalsSchema = z.object({
  kcal: nonNeg,
  protein_g: nonNeg,
  carbs_g: nonNeg,
  fat_g: nonNeg,
  fiber_g: nonNeg,
  sugar_g: nonNeg,
  sodium_mg: nonNeg,
});
export type Totals = z.infer<typeof TotalsSchema>;

export const ConfidenceSchema = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof ConfidenceSchema>;

/* ---------- Gemini: meal estimate ---------- */

export const EstimateOkSchema = z.object({
  status: z.literal("ok"),
  items: z.array(MealItemSchema).min(1).max(30),
  totals: TotalsSchema,
  confidence: ConfidenceSchema,
  notes: z.string().max(2000).describe("Short assumptions made, e.g. oil or portion assumptions"),
});

export const EstimateClarifySchema = z.object({
  status: z.literal("clarify"),
  question: z.string().min(1).max(500).describe("One short question about the most ambiguous quantity"),
  partial_items: z.array(MealItemSchema).max(30),
});

export const EstimateSchema = z.discriminatedUnion("status", [EstimateOkSchema, EstimateClarifySchema]);
export type Estimate = z.infer<typeof EstimateSchema>;
export type EstimateOk = z.infer<typeof EstimateOkSchema>;

/* ---------- Gemini: daily review ---------- */

export const ReviewOutputSchema = z.object({
  score: z.int().min(0).max(100),
  summary: z.string().min(1).max(2000),
  wins: z.array(z.string().max(500)).max(6),
  improvements: z.array(z.string().max(600)).max(6),
  tomorrow_tip: z.string().min(1).max(600),
});
export type ReviewOutput = z.infer<typeof ReviewOutputSchema>;

/* ---------- API inputs ---------- */

// ~6 MB of base64; client compresses to ~1024px so real payloads are far smaller.
const Base64Jpeg = z
  .string()
  .max(8_000_000)
  .regex(/^[A-Za-z0-9+/=]+$/, "image must be base64 without a data: prefix");

export const ClarificationSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(300),
});
export type Clarification = z.infer<typeof ClarificationSchema>;

export const LogRequestSchema = z
  .object({
    text: z.string().trim().max(300).optional(),
    image: Base64Jpeg.optional(),
    clarifications: z.array(ClarificationSchema).max(2).default([]),
  })
  .refine((v) => (v.text && v.text.length > 0) || v.image, {
    message: "Add a description or a photo",
  });
export type LogRequest = z.input<typeof LogRequestSchema>;

export const SaveMealSchema = z.object({
  input_text: z.string().max(300).nullable(),
  had_image: z.boolean(),
  items: z.array(MealItemSchema).min(1).max(30),
  confidence: ConfidenceSchema,
  ai_notes: z.string().max(2000).nullable(),
});
export type SaveMealInput = z.infer<typeof SaveMealSchema>;

export const WeightSchema = z.object({
  weight_kg: z.number().min(20).max(400),
});

export const ReviewRequestSchema = z.object({
  date: z.iso.date(),
});

/* ---------- Profile ---------- */

export const SexSchema = z.enum(["male", "female"]);
export const ActivitySchema = z.enum(["sedentary", "light", "moderate", "active", "very_active"]);
export const GoalSchema = z.enum(["lose", "maintain", "gain"]);
export const PaceSchema = z.union([z.literal(0.25), z.literal(0.5), z.literal(0.75)]);

export const BodyStatsSchema = z.object({
  date_of_birth: z.iso.date(),
  sex: SexSchema,
  height_cm: z.number().min(100).max(250),
  weight_kg: z.number().min(20).max(400),
  activity_level: ActivitySchema,
  goal: GoalSchema,
  pace_kg_per_week: PaceSchema,
});
export type BodyStatsInput = z.infer<typeof BodyStatsSchema>;
