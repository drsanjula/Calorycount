"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AlertIcon, CameraIcon, ChevronLeft, ImageIcon, SparkIcon, XIcon } from "@/components/icons";
import { MealItemRow } from "@/components/MealItemRow";
import { NutrientStrip } from "@/components/NutrientStrip";
import { Card, Pill } from "@/components/ui";
import { compressImage, downloadOriginal } from "@/lib/compressImage";
import type { Clarification, Confidence, MealItem, Totals } from "@/lib/schemas";

type Estimate = { items: MealItem[]; totals: Totals; confidence: Confidence; notes: string };
type Clarify = { question: string; partial_items: MealItem[] };
type Phase = "compose" | "analyzing" | "clarify" | "preview" | "saving";

const DRAFT_KEY = "intake:logDraft";
const MAX_TEXT = 300;

function useOnline() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

export function LogFlow({ saveCameraPhotos }: { saveCameraPhotos: boolean }) {
  const router = useRouter();
  const online = useOnline();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [image, setImage] = useState<{ base64: string; dataUrl: string } | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>("compose");
  const [error, setError] = useState<string | null>(null);
  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [clarify, setClarify] = useState<Clarify | null>(null);
  const [answer, setAnswer] = useState("");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [lastAttempt, setLastAttempt] = useState<Clarification[]>([]);

  // Keep the typed text safe across reloads / navigation.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from storage
      if (saved) setText(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      if (text) localStorage.setItem(DRAFT_KEY, text);
      else localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }, [text]);

  async function onPick(file: File | undefined, fromCamera: boolean) {
    if (!file) return;
    setError(null);
    setImageBusy(true);
    try {
      if (fromCamera && saveCameraPhotos) downloadOriginal(file);
      setImage(await compressImage(file));
    } catch {
      setError("Couldn't read that photo. Try another one.");
    } finally {
      setImageBusy(false);
    }
  }

  async function analyze(qa: Clarification[]) {
    if (!navigator.onLine) {
      setError("Offline — can't analyze right now");
      return;
    }
    setError(null);
    setLastAttempt(qa);
    const returnTo: Phase = clarify ? "clarify" : "compose";
    setPhase("analyzing");
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() || undefined, image: image?.base64, clarifications: qa }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Analysis failed. Try again.");
      setClarifications(qa);
      if (data.status === "clarify") {
        setClarify({ question: data.question, partial_items: data.partial_items ?? [] });
        setAnswer("");
        setPhase("clarify");
      } else {
        setEstimate(data as Estimate);
        setPhase("preview");
      }
    } catch (e) {
      setError(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Couldn't reach the server. Try again.");
      // Go back to where the user was; nothing they typed is lost.
      setPhase(returnTo);
    }
  }

  function start() {
    setClarifications([]);
    setClarify(null);
    void analyze([]);
  }

  function sendAnswer(a: string) {
    if (!clarify) return;
    void analyze([...clarifications, { question: clarify.question, answer: a }]);
  }

  function retry() {
    void analyze(lastAttempt);
  }

  function discard() {
    setError(null);
    setEstimate(null);
    setClarify(null);
    setClarifications([]);
    setPhase("compose");
  }

  async function save() {
    if (!estimate) return;
    setPhase("saving");
    setError(null);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_text: text.trim() || null,
          had_image: !!image,
          items: estimate.items,
          confidence: estimate.confidence,
          ai_notes: estimate.notes || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't save. Try again.");
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Couldn't reach the server. Try again.");
      setPhase("preview");
    }
  }

  const canAnalyze = (text.trim().length > 0 || !!image) && !imageBusy;
  const busy = phase === "analyzing" || phase === "saving";

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3 pt-2">
        {phase !== "compose" && !busy && (
          <button type="button" onClick={discard} aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-[var(--shadow-card)]">
            <ChevronLeft />
          </button>
        )}
        <div>
          <h1 className="h-display">{phase === "preview" || phase === "saving" ? "Meal analysis" : "Log a meal"}</h1>
          <p className="mt-1 text-muted">
            {phase === "preview" || phase === "saving" ? "Here’s what we estimated. Save it or discard." : "Snap it, describe it, or both."}
          </p>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl bg-danger-soft p-4" role="alert">
          <AlertIcon className="h-6 w-6 shrink-0 text-danger" />
          <div className="flex-1">
            <p className="font-semibold">{error}</p>
            <p className="text-sm text-muted">Your text and photo are kept.</p>
          </div>
          {phase !== "preview" && online && canAnalyze && (
            <button type="button" onClick={retry} className="rounded-full bg-surface px-4 py-2 text-sm font-semibold text-brand">
              Retry
            </button>
          )}
        </div>
      )}

      {!online && (
        <p className="rounded-2xl bg-warn-soft p-3 text-sm font-medium text-warn">Offline — can’t analyze right now. Your text is kept.</p>
      )}

      {phase === "compose" && (
        <>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { void onPick(e.target.files?.[0], true); e.target.value = ""; }} />
          <input ref={galleryRef} type="file" accept="image/*" hidden onChange={(e) => { void onPick(e.target.files?.[0], false); e.target.value = ""; }} />

          {image ? (
            <Card className="relative p-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- local data URL thumbnail */}
              <img src={image.dataUrl} alt="Meal photo" className="h-44 w-full rounded-2xl object-cover" />
              <button type="button" onClick={() => setImage(null)} aria-label="Remove photo" className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 shadow">
                <XIcon className="h-5 w-5" />
              </button>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => cameraRef.current?.click()} className="btn-ghost justify-center py-2">
                  <CameraIcon /> Retake
                </button>
                <button type="button" onClick={() => galleryRef.current?.click()} className="btn-ghost justify-center py-2">
                  <ImageIcon /> Choose another
                </button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                disabled={imageBusy}
                className="col-span-2 flex h-44 flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] bg-brand text-white shadow-[var(--shadow-card)] active:bg-brand-600"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
                  <CameraIcon className="h-9 w-9" />
                </span>
                <span className="text-lg font-semibold">{imageBusy ? "Processing…" : "Take photo"}</span>
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                disabled={imageBusy}
                className="card flex h-44 flex-col items-center justify-center gap-3 text-center active:bg-brand-soft"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-limit-soft text-limit">
                  <ImageIcon className="h-7 w-7" />
                </span>
                <span className="text-sm font-semibold">Gallery</span>
              </button>
            </div>
          )}

          <Card className="p-3">
            <label htmlFor="meal-text" className="sr-only">
              Describe your meal
            </label>
            <textarea
              id="meal-text"
              rows={3}
              maxLength={MAX_TEXT}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Optional: describe it, e.g. rice and curry with dhal, pol sambol and a fried fish"
              className="w-full resize-none bg-transparent text-base outline-none placeholder:text-muted/70"
            />
            <p className="text-right text-xs text-muted">
              {text.length}/{MAX_TEXT}
            </p>
          </Card>

          <button type="button" className="btn-primary" disabled={!canAnalyze || !online} onClick={start}>
            {online ? "Analyze meal →" : "Offline — can’t analyze right now"}
          </button>
        </>
      )}

      {phase === "analyzing" && <Analyzing thumb={image?.dataUrl} />}

      {phase === "clarify" && clarify && (
        <Card className="space-y-4 border border-brand/15 bg-brand-soft/50">
          <div className="flex gap-3">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element -- local data URL thumbnail
              <img src={image.dataUrl} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface text-brand">
                <SparkIcon className="h-7 w-7" />
              </span>
            )}
            <div>
              <p className="text-lg leading-snug font-bold">{clarify.question}</p>
              <p className="mt-1 text-sm text-muted">This helps give you more accurate nutrition info.</p>
            </div>
          </div>
          {clarify.partial_items.length > 0 && (
            <p className="text-sm text-muted">So far: {clarify.partial_items.map((i) => i.name).join(", ")}</p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (answer.trim()) sendAnswer(answer.trim());
            }}
            className="space-y-2"
          >
            <input className="input" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Your answer" autoFocus maxLength={300} />
            <div className="grid grid-cols-2 gap-2">
              <button type="submit" className="btn-primary h-12 text-base" disabled={!answer.trim() || !online}>
                Send
              </button>
              <button type="button" className="btn-outline" disabled={!online} onClick={() => sendAnswer("Not sure — use a typical portion.")}>
                Just estimate
              </button>
            </div>
          </form>
          <p className="text-xs text-muted">Question {clarifications.length + 1} of 2 max.</p>
        </Card>
      )}

      {(phase === "preview" || phase === "saving") && estimate && (
        <>
          <Card>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-bold">Detected items</h2>
              <Pill tone={estimate.confidence === "high" ? "brand" : estimate.confidence === "medium" ? "warn" : "danger"}>
                {estimate.confidence[0].toUpperCase() + estimate.confidence.slice(1)} confidence
              </Pill>
            </div>
            <ul className="divide-y divide-line">
              {estimate.items.map((it, i) => (
                <MealItemRow key={i} item={it} />
              ))}
            </ul>
          </Card>
          <Card>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-lg font-bold">Nutrition totals</h2>
              <span className="text-xs text-muted">Estimated for this meal</span>
            </div>
            <NutrientStrip totals={estimate.totals} />
          </Card>
          {estimate.notes && <p className="px-1 text-sm text-muted">{estimate.notes}</p>}
          <button type="button" className="btn-primary" onClick={save} disabled={phase === "saving"}>
            {phase === "saving" ? "Saving…" : "Save meal to log"}
          </button>
          <button type="button" className="btn-outline" onClick={discard} disabled={phase === "saving"}>
            Discard
          </button>
        </>
      )}
    </div>
  );
}

function Analyzing({ thumb }: { thumb?: string }) {
  return (
    <Card className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="relative h-24 w-24">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element -- local data URL thumbnail
          <img src={thumb} alt="" className="h-24 w-24 rounded-3xl object-cover opacity-80" />
        ) : (
          <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-soft text-brand">
            <SparkIcon className="h-10 w-10" />
          </span>
        )}
        <span className="absolute -inset-2 animate-spin rounded-[2rem] border-4 border-brand/20 border-t-brand" />
      </div>
      <div>
        <p className="text-lg font-bold">Analyzing your meal…</p>
        <p className="text-sm text-muted">Identifying foods and estimating portions</p>
      </div>
    </Card>
  );
}
