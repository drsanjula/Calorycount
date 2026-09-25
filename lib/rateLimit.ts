import "server-only";
import { db } from "./supabase";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

export async function isRateLimited(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count, error } = await db()
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("attempted_at", since);
  if (error) throw new Error(`rate limit check failed: ${error.message}`);
  return (count ?? 0) >= MAX_FAILURES;
}

export async function recordFailure(ip: string): Promise<void> {
  const { error } = await db().from("login_attempts").insert({ ip });
  if (error) throw new Error(`rate limit write failed: ${error.message}`);
  // Opportunistic cleanup of old rows.
  await db()
    .from("login_attempts")
    .delete()
    .lt("attempted_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
}

export async function clearFailures(ip: string): Promise<void> {
  await db().from("login_attempts").delete().eq("ip", ip);
}
