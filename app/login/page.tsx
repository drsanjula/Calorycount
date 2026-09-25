import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Keypad } from "./Keypad";

export const metadata: Metadata = { title: "Unlock" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center px-6 pt-16 pb-8">
      <Logo size="lg" />
      <h1 className="h-display mt-8 text-center">Welcome back</h1>
      <p className="mt-2 mb-8 text-center text-muted">Enter your passcode to continue</p>
      <Keypad />
      <p className="mt-auto flex items-center gap-2 pt-10 text-sm text-muted">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1Zm2 0h6V8a3 3 0 0 0-6 0v2Z" />
        </svg>
        Private, single-user tracker
      </p>
    </main>
  );
}
