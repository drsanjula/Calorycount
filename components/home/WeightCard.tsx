"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ScaleIcon } from "@/components/icons";
import { fmt } from "@/components/ui";

/** Current weight with an inline "Update weight" sheet. */
export function WeightCard({ weightKg }: { weightKg: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openSheet = () => {
    setValue(weightKg === null ? "" : String(weightKg));
    setError(null);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(value);
    if (!Number.isFinite(n) || n < 20 || n > 400) {
      setError("Enter a weight between 20 and 400 kg");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight_kg: n }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Couldn't save weight");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save weight");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button type="button" onClick={openSheet} className="card flex items-center gap-3 p-3 text-left" aria-expanded={open}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <ScaleIcon />
        </span>
        <span>
          <span className="block text-xs text-muted">Current weight</span>
          <span className="block text-lg font-bold leading-tight">{weightKg === null ? "—" : `${fmt(weightKg, 1)} kg`}</span>
          <span className="block text-xs font-semibold text-brand">Update weight</span>
        </span>
      </button>

      {open && (
        <form
          onSubmit={save}
          className="card absolute right-0 top-full z-20 mt-2 w-64 space-y-3 border border-line"
          aria-label="Update weight"
        >
          <label className="block">
            <span className="label">Weight (kg)</span>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              step="0.1"
              min={20}
              max={400}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="button" className="btn-outline h-11" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn-primary h-11 text-base" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
