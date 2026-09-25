"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { z } from "zod";
import { setTargetOverride } from "@/app/(app)/settings/actions";
import { ChevronRight, InfoIcon } from "@/components/icons";
import { Card, fmt, Pill } from "@/components/ui";
import { KCAL_FLOOR, TARGET_KEYS, type Sex, type TargetKey, type TargetsSnapshot } from "@/lib/targets";
import { TARGET_META } from "./targetMeta";

export function TargetsCard({ targets, sex }: { targets: TargetsSnapshot; sex: Sex }) {
  const [open, setOpen] = useState<TargetKey | null>(null);
  return (
    <Card>
      <h2 className="text-xl font-bold">Daily targets</h2>
      <p className="mt-1 text-sm text-muted">
        Tap a target to set your own. A custom calorie limit recalculates the auto macros from it.
      </p>
      <ul className="mt-3 divide-y divide-line">
        {TARGET_KEYS.map((key) => (
          <li key={key}>
            <TargetRow
              targetKey={key}
              value={targets[key]}
              custom={targets.sources[key] === "custom"}
              open={open === key}
              onToggle={() => setOpen((o) => (o === key ? null : key))}
            />
          </li>
        ))}
      </ul>
      {targets.floored && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-brand-soft p-3 text-sm">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          Limit raised to safe minimum ({fmt(KCAL_FLOOR[sex])} kcal/day).
        </p>
      )}
    </Card>
  );
}

function TargetRow({
  targetKey,
  value,
  custom,
  open,
  onToggle,
}: {
  targetKey: TargetKey;
  value: number;
  custom: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const meta = TARGET_META[targetKey];
  const router = useRouter();
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const schema = z.coerce
    .number({ error: "Enter a number" })
    .min(meta.min, `Min ${fmt(meta.min)} ${meta.unit}`)
    .max(meta.max, `Max ${fmt(meta.max)} ${meta.unit}`);

  const save = (next: number | null) => {
    setError(null);
    start(async () => {
      const res = await setTargetOverride({ key: targetKey, value: next });
      if (!res.ok) return setError(res.error ?? "Couldn't save");
      onToggle();
      router.refresh();
    });
  };

  const submit = () => {
    const parsed = schema.safeParse(draft.trim() === "" ? undefined : draft);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid value");
    save(parsed.data);
  };

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setDraft(String(value));
          setError(null);
          onToggle();
        }}
        className="flex w-full items-center gap-3 py-3 text-left"
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: meta.color }} />
        <span className="flex-1 font-medium">{meta.label}</span>
        <span className="font-bold">
          {fmt(value)} <span className="text-sm font-normal text-muted">{meta.unit}</span>
        </span>
        <Pill tone={custom ? "brand" : "muted"}>{custom ? "Custom" : "Auto"}</Pill>
        <ChevronRight className={`h-4 w-4 text-muted transition ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <form
          noValidate
          className="mb-3 space-y-2 rounded-2xl bg-bg p-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className="label" htmlFor={`t-${targetKey}`}>
            Custom {meta.label.toLowerCase()} ({meta.unit})
          </label>
          <div className="flex gap-2">
            <input
              id={`t-${targetKey}`}
              type="number"
              inputMode="decimal"
              min={meta.min}
              max={meta.max}
              step={meta.step}
              className="input flex-1"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            <button type="submit" disabled={pending} className="rounded-xl bg-brand px-4 font-semibold text-white disabled:opacity-50">
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">
              Allowed {fmt(meta.min)}–{fmt(meta.max)} {meta.unit}
            </span>
            {custom && (
              <button type="button" className="btn-ghost" disabled={pending} onClick={() => save(null)}>
                Reset to auto
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
