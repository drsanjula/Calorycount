import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { addWeight } from "@/lib/data";
import { WeightSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  const parsed = WeightSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a weight between 20 and 400 kg" }, { status: 400 });
  try {
    await addWeight(parsed.data.weight_kg);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("save weight failed", e);
    return NextResponse.json({ error: "Couldn't save weight" }, { status: 500 });
  }
}
