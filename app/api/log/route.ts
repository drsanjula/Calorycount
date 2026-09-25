import type { Part } from "@google/genai";
import { NextResponse } from "next/server";
import { generateStructured, GeminiError } from "@/lib/gemini";
import { sumItems } from "@/lib/nutrition";
import { FORCE_ESTIMATE, LOG_SYSTEM } from "@/lib/prompts";
import { EstimateSchema, LogRequestSchema, type Estimate } from "@/lib/schemas";

export const maxDuration = 60;

const MAX_CLARIFY_ROUNDS = 2;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = LogRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { text, image, clarifications } = parsed.data;
  const force = clarifications.length >= MAX_CLARIFY_ROUNDS;

  const buildParts = (forceEstimate: boolean): Part[] => {
    const parts: Part[] = [];
    if (image) parts.push({ inlineData: { mimeType: "image/jpeg", data: image } });
    const lines: string[] = [];
    lines.push(text ? `Meal description: ${text}` : "No description given — estimate from the photo.");
    if (image) lines.push("A photo of the meal is attached.");
    for (const c of clarifications) lines.push(`You asked: ${c.question}\nUser answered: ${c.answer}`);
    if (forceEstimate) lines.push(FORCE_ESTIMATE);
    parts.push({ text: lines.join("\n\n") });
    return parts;
  };

  try {
    let result: Estimate = await generateStructured({ schema: EstimateSchema, system: LOG_SYSTEM, parts: buildParts(force), thinking: "low" });
    if (result.status === "clarify" && force) {
      result = await generateStructured({ schema: EstimateSchema, system: LOG_SYSTEM, parts: buildParts(true), thinking: "low" });
    }
    if (result.status === "clarify") {
      if (!force) return NextResponse.json({ status: "clarify", question: result.question, partial_items: result.partial_items });
      if (result.partial_items.length === 0) throw new GeminiError("bad_output", "model kept asking after the clarify limit");
      result = { status: "ok", items: result.partial_items, totals: sumItems(result.partial_items), confidence: "low", notes: "Best estimate from partial information." };
    }
    // Totals are always recomputed from the items so they add up exactly.
    return NextResponse.json({ status: "ok", items: result.items, totals: sumItems(result.items), confidence: result.confidence, notes: result.notes });
  } catch (e) {
    const err = e instanceof GeminiError ? e : new GeminiError("upstream", String(e));
    console.error("log analysis failed", err.kind, err.message);
    const status = err.kind === "rate_limited" ? 429 : err.kind === "timeout" ? 504 : 502;
    return NextResponse.json({ error: err.userMessage, retryable: true }, { status });
  }
}
