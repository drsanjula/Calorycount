"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SESSION_COOKIE, SESSION_MAX_AGE_S } from "@/lib/config";
import { env } from "@/lib/env";
import { clearFailures, isRateLimited, recordFailure } from "@/lib/rateLimit";
import { createSessionToken, safeEqual } from "@/lib/session";

export interface LoginState {
  error?: string;
}

const PasscodeSchema = z.string().min(1).max(64);

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = PasscodeSchema.safeParse(formData.get("passcode"));
  if (!parsed.success) return { error: "Enter your passcode" };

  const ip = await clientIp();
  try {
    if (await isRateLimited(ip)) return { error: "Too many attempts. Try again in 15 minutes." };
    const { APP_PASSCODE, SESSION_SECRET } = env();
    if (!(await safeEqual(parsed.data, APP_PASSCODE))) {
      await recordFailure(ip);
      return { error: "Wrong passcode" };
    }
    await clearFailures(ip);
    const token = await createSessionToken(SESSION_SECRET);
    (await cookies()).set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_S,
    });
  } catch (e) {
    console.error("login failed", e);
    return { error: "Couldn't sign in right now. Check your connection." };
  }
  redirect("/");
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
