"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { saveGoalNote, setReviewTone, setSaveCameraPhotos } from "@/app/(app)/settings/actions";
import type { ActionResult } from "@/app/profileActions";
import { CameraIcon, TargetIcon } from "@/components/icons";
import { Card } from "@/components/ui";
import { ChatIcon } from "./icons";
import { GOAL_NOTE_MAX } from "./targetMeta";

/** Runs a settings action, refreshes on success and keeps the error for display. */
function useSave() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (action: () => Promise<ActionResult>, onDone?: () => void) => {
    setError(null);
    start(async () => {
      const res = await action();
      if (!res.ok) return setError(res.error ?? "Couldn't save");
      onDone?.();
      router.refresh();
    });
  };
  return { pending, error, run };
}

function Bubble({ children }: { children: ReactNode }) {
  return <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">{children}</span>;
}

export function GoalNoteCard({ initial }: { initial: string }) {
  const [note, setNote] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [justSaved, setJustSaved] = useState(false);
  const { pending, error, run } = useSave();
  const dirty = note.trim() !== saved.trim();

  return (
    <section className="rounded-[var(--radius-card)] bg-brand-soft p-4">
      <div className="flex gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-brand">
          <TargetIcon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <label htmlFor="goal-note" className="text-lg font-bold">
            Goal note
          </label>
          <p className="text-sm text-muted">Anything the daily review should keep in mind.</p>
        </div>
      </div>
      <textarea
        id="goal-note"
        rows={3}
        maxLength={GOAL_NOTE_MAX}
        className="input mt-3 h-auto resize-none py-2"
        placeholder="e.g. Training for a 10k, trying to eat more vegetables"
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setJustSaved(false);
        }}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">
          {note.length}/{GOAL_NOTE_MAX}
        </span>
        {error && <span className="flex-1 text-sm text-danger">{error}</span>}
        <button
          type="button"
          disabled={!dirty || pending}
          onClick={() =>
            run(
              () => saveGoalNote(note),
              () => {
                setSaved(note);
                setJustSaved(true);
              },
            )
          }
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : !dirty && justSaved ? "Saved" : "Save"}
        </button>
      </div>
    </section>
  );
}

export function ToneCard({ initial }: { initial: "blunt" | "gentle" }) {
  const [tone, setTone] = useState(initial);
  const { pending, error, run } = useSave();
  const choose = (t: "blunt" | "gentle") => {
    if (t === tone) return;
    const prev = tone;
    setTone(t);
    run(async () => {
      const res = await setReviewTone(t);
      if (!res.ok) setTone(prev);
      return res;
    });
  };

  return (
    <Card className="flex flex-wrap items-center gap-3">
      <Bubble>
        <ChatIcon />
      </Bubble>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold">Review tone</h2>
        <p className="text-sm text-muted">How your daily review gives feedback.</p>
      </div>
      <div className="grid w-full grid-cols-2 gap-2 pl-15" role="group" aria-label="Review tone">
        {(["gentle", "blunt"] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tone === t}
            disabled={pending}
            onClick={() => choose(t)}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted capitalize transition aria-pressed:border-brand aria-pressed:bg-brand-soft aria-pressed:text-brand"
          >
            {t}
          </button>
        ))}
      </div>
      {error && <p className="w-full text-sm text-danger">{error}</p>}
    </Card>
  );
}

export function PhotosCard({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const { pending, error, run } = useSave();
  const toggle = () => {
    const next = !on;
    setOn(next);
    run(async () => {
      const res = await setSaveCameraPhotos(next);
      if (!res.ok) setOn(!next);
      return res;
    });
  };

  return (
    <Card className="flex flex-wrap items-center gap-3">
      <Bubble>
        <CameraIcon className="h-6 w-6" />
      </Bubble>
      <div className="min-w-0 flex-1">
        <h2 id="photos-label" className="text-lg font-bold">
          Save camera photos to device
        </h2>
        <p className="text-sm text-muted">Also keep photos you take for a meal on your phone.</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby="photos-label"
        disabled={pending}
        onClick={toggle}
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${on ? "bg-brand" : "bg-line"}`}
      >
        <span className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${on ? "translate-x-6" : ""}`} />
      </button>
      {error && <p className="w-full text-sm text-danger">{error}</p>}
    </Card>
  );
}
