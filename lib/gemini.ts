import "server-only";
import { ApiError, GoogleGenAI, ThinkingLevel, type Part } from "@google/genai";
import { z } from "zod";
import { GEMINI_MODEL } from "./config";
import { env } from "./env";

let client: GoogleGenAI | undefined;
function ai(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: env().GEMINI_API_KEY });
  return client;
}

export type GeminiErrorKind = "rate_limited" | "timeout" | "bad_output" | "upstream";

export class GeminiError extends Error {
  constructor(
    public kind: GeminiErrorKind,
    message: string,
  ) {
    super(message);
  }
  get userMessage(): string {
    switch (this.kind) {
      case "rate_limited":
        return "The AI is busy right now (rate limited). Try again in a minute.";
      case "timeout":
        return "The AI took too long to respond. Try again.";
      case "bad_output":
        return "The AI returned something unexpected. Try again.";
      default:
        return "Couldn't reach the AI. Try again.";
    }
  }
}

/** Gemini's JSON-schema subset: drop keywords it doesn't accept. */
export function toGeminiSchema(schema: z.ZodType): unknown {
  const json = z.toJSONSchema(schema, { target: "draft-2020-12", io: "output" }) as Record<string, unknown>;
  const strip = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(strip);
    if (node && typeof node === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node)) {
        if (k === "$schema" || k === "exclusiveMinimum" || k === "exclusiveMaximum" || k === "pattern" || k === "maxLength" || k === "minLength") continue;
        // Gemini's schema subset has `enum` but not `const`.
        if (k === "const") out.enum = [v];
        else out[k] = strip(v);
      }
      return out;
    }
    return node;
  };
  return strip(json);
}

interface GenerateArgs<T> {
  schema: z.ZodType<T>;
  system: string;
  parts: Part[];
  thinking: "low" | "medium" | "high";
  timeoutMs?: number;
}

const LEVEL = { low: ThinkingLevel.LOW, medium: ThinkingLevel.MEDIUM, high: ThinkingLevel.HIGH } as const;

/**
 * One structured-output call validated with Zod. Malformed output gets exactly
 * one retry; network/429/timeout errors are surfaced for the user to retry.
 */
export async function generateStructured<T>({ schema, system, parts, thinking, timeoutMs = 45_000 }: GenerateArgs<T>): Promise<T> {
  const responseJsonSchema = toGeminiSchema(schema);
  let lastIssue = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    let text: string | undefined;
    try {
      const res = await ai().models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts }],
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
          responseJsonSchema,
          thinkingConfig: { thinkingLevel: LEVEL[thinking] },
          httpOptions: { timeout: timeoutMs },
        },
      });
      text = res.text;
    } catch (e) {
      throw classify(e);
    }
    try {
      const parsed = schema.safeParse(JSON.parse(text ?? ""));
      if (parsed.success) return parsed.data;
      lastIssue = parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    } catch {
      lastIssue = "invalid JSON";
    }
    console.warn(`Gemini output rejected (attempt ${attempt + 1}): ${lastIssue}`);
  }
  throw new GeminiError("bad_output", `Gemini output failed validation: ${lastIssue}`);
}

function classify(e: unknown): GeminiError {
  if (e instanceof ApiError) {
    if (e.status === 429) return new GeminiError("rate_limited", e.message);
    if (e.status === 408 || e.status === 504) return new GeminiError("timeout", e.message);
    return new GeminiError("upstream", `Gemini ${e.status}: ${e.message}`);
  }
  if (e instanceof Error && (e.name === "AbortError" || e.name === "TimeoutError" || /abort|timed? ?out/i.test(e.message))) {
    return new GeminiError("timeout", e.message);
  }
  return new GeminiError("upstream", e instanceof Error ? e.message : String(e));
}
