import { NextResponse } from "next/server";
import { today } from "@/lib/data";
import { GeminiError } from "@/lib/gemini";
import { getOrCreateReview } from "@/lib/review";
import { ReviewRequestSchema } from "@/lib/schemas";

export const maxDuration = 60;

export async function POST(req: Request) {
  const parsed = ReviewRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  const { date } = parsed.data;
  // Only finished days can be reviewed.
  if (date >= today()) return NextResponse.json({ error: "Only past days can be reviewed" }, { status: 400 });

  try {
    const result = await getOrCreateReview(date);
    if (result.status === "empty") return NextResponse.json(result, { status: 404 });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof GeminiError) {
      console.error("review failed", e.kind, e.message);
      const status = e.kind === "rate_limited" ? 429 : e.kind === "timeout" ? 504 : 502;
      return NextResponse.json({ error: e.userMessage, retryable: true }, { status });
    }
    console.error("review failed", e);
    return NextResponse.json({ error: "Couldn't create the review. Try again." }, { status: 500 });
  }
}
