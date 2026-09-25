"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AlertIcon } from "@/components/icons";
import { ReviewCard, type ReviewCardData } from "@/components/ReviewCard";
import { Card } from "@/components/ui";
import { formatDay } from "@/lib/time";

const DISMISS_EVENT = "intake:reviewDismissed";
const dismissKey = (date: string) => `intake:reviewDismissed:${date}`;

function readDismissed(date: string): boolean {
  try {
    return localStorage.getItem(dismissKey(date)) === "1";
  } catch {
    return false;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(DISMISS_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(DISMISS_EVENT, cb);
  };
}

type FetchResult = { kind: "ok"; review: ReviewCardData } | { kind: "empty" } | { kind: "error"; message: string };

async function fetchReview(date: string): Promise<FetchResult> {
  try {
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    const data = (await res.json().catch(() => ({}))) as { status?: string; review?: ReviewCardData; error?: string };
    if (data.status === "empty") return { kind: "empty" };
    if (res.ok && data.review) return { kind: "ok", review: data.review };
    return { kind: "error", message: data.error ?? "Couldn't create yesterday's review. Try again." };
  } catch {
    return { kind: "error", message: "Couldn't reach the server. Check your connection and try again." };
  }
}

/**
 * Yesterday's review on Home. The server says whether yesterday has meals and
 * a stored review; if it has meals but no review, this generates one.
 */
export function YesterdayReview({
  date,
  hasMeals,
  initialReview,
}: {
  date: string;
  hasMeals: boolean;
  initialReview: ReviewCardData | null;
}) {
  // Hidden on the server render; localStorage is only read after hydration.
  const dismissed = useSyncExternalStore(subscribe, () => readDismissed(date), () => true);
  const [review, setReview] = useState<ReviewCardData | null>(initialReview);
  const [empty, setEmpty] = useState(!hasMeals);
  const [error, setError] = useState<string | null>(null);

  const needsReview = !dismissed && !empty && !review && !error;
  useEffect(() => {
    if (!needsReview) return;
    let cancelled = false;
    fetchReview(date).then((r) => {
      if (cancelled) return;
      if (r.kind === "empty") setEmpty(true);
      else if (r.kind === "ok") setReview(r.review);
      else setError(r.message);
    });
    return () => {
      cancelled = true;
    };
  }, [needsReview, date]);

  const dismiss = () => {
    try {
      localStorage.setItem(dismissKey(date), "1");
    } catch {}
    window.dispatchEvent(new Event(DISMISS_EVENT));
  };

  if (dismissed) return null;

  if (empty) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-track px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Nothing logged yesterday</p>
          <p className="text-xs text-muted">Log your meals to get a daily review.</p>
        </div>
        <button type="button" className="btn-ghost shrink-0" onClick={dismiss}>
          Got it
        </button>
      </div>
    );
  }

  return (
    <section aria-label="Yesterday's review" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold">Yesterday&apos;s review</h2>
        <span className="text-sm text-muted">{formatDay(date)}</span>
      </div>

      {review ? (
        <>
          <ReviewCard review={review} />
          <button type="button" className="btn-primary" onClick={dismiss}>
            Got it
          </button>
          <p className="text-center text-xs text-muted">This review will be hidden after you&apos;ve seen it today.</p>
        </>
      ) : error ? (
        <Card className="flex items-start gap-3">
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div className="flex-1">
            <p className="text-sm font-medium">{error}</p>
            <button type="button" className="btn-outline mt-3 h-10" onClick={() => setError(null)}>
              Retry
            </button>
          </div>
        </Card>
      ) : (
        <Card className="animate-pulse" aria-busy="true">
          <p className="sr-only">Creating yesterday&apos;s review…</p>
          <div className="flex items-center gap-4">
            <div className="h-28 w-28 shrink-0 rounded-full border-[11px] border-track" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded bg-track" />
              <div className="h-3 w-full rounded bg-track" />
              <div className="h-3 w-5/6 rounded bg-track" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-track" />
            <div className="h-3 w-4/6 rounded bg-track" />
          </div>
          <p className="mt-3 text-center text-xs text-muted">Reviewing yesterday…</p>
        </Card>
      )}
    </section>
  );
}
