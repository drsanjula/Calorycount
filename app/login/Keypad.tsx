"use client";

import { useActionState, useRef, useState } from "react";
import { login, type LoginState } from "./actions";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const MAX = 12;

export function Keypad() {
  const [code, setCode] = useState("");
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const formRef = useRef<HTMLFormElement>(null);

  const press = (d: string) => setCode((c) => (c.length < MAX ? c + d : c));
  const back = () => setCode((c) => c.slice(0, -1));

  const dots = Math.max(6, code.length);

  return (
    <form
      ref={formRef}
      action={(fd) => {
        action(fd);
        setCode("");
      }}
      className="flex flex-col items-center"
    >
      <input type="hidden" name="passcode" value={code} />
      <div className="mb-2 flex h-5 gap-4" aria-label={`${code.length} digits entered`}>
        {Array.from({ length: dots }, (_, i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full border-2 transition ${
              i < code.length ? "border-brand bg-brand" : "border-line bg-surface"
            }`}
          />
        ))}
      </div>
      <p className="h-6 text-sm text-danger" role="alert">
        {state.error ?? ""}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-x-7 gap-y-5">
        {KEYS.map((k) => (
          <Key key={k} onClick={() => press(k)}>
            {k}
          </Key>
        ))}
        <span />
        <Key onClick={() => press("0")}>0</Key>
        <button
          type="button"
          onClick={back}
          aria-label="Delete"
          className="flex h-20 w-20 items-center justify-center rounded-full bg-track text-ink active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 5h11v14H9l-6-7 6-7Z" strokeLinejoin="round" />
            <path d="m12 9 5 6m0-6-5 6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <button type="submit" disabled={code.length === 0 || pending} className="btn-primary mt-10 max-w-xs">
        {pending ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}

function Key({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-20 w-20 items-center justify-center rounded-full bg-surface text-3xl font-medium text-ink shadow-[var(--shadow-card)] active:scale-95 active:bg-brand-soft"
    >
      {children}
    </button>
  );
}
