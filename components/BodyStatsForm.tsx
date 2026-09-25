"use client";

import { useMemo, useState, useTransition } from "react";
import type { ActionResult } from "@/app/profileActions";
import type { BodyStatsInput } from "@/lib/schemas";
import { computeTargets, KCAL_FLOOR, type ActivityLevel, type Goal, type Overrides, type Pace, type Sex } from "@/lib/targets";
import { BarsIcon, FlameIcon, InfoIcon, TargetIcon } from "./icons";
import { Bar, Card, fmt, Segmented, StatTile } from "./ui";

const ACTIVITIES: { value: ActivityLevel; label: string; hint: string }[] = [
  { value: "sedentary", label: "Sedentary", hint: "Desk job, little exercise" },
  { value: "light", label: "Light", hint: "Exercise 1–3 days/week" },
  { value: "moderate", label: "Moderate", hint: "Exercise 3–5 days/week" },
  { value: "active", label: "Active", hint: "Exercise 6–7 days/week" },
  { value: "very_active", label: "Very active", hint: "Hard training or physical job" },
];

export interface BodyStatsDefaults {
  date_of_birth: string;
  sex: Sex;
  height_cm: string;
  weight_kg: string;
  activity_level: ActivityLevel;
  goal: Goal;
  pace_kg_per_week: Pace;
}

export function BodyStatsForm({
  defaults,
  today,
  overrides = {},
  submitLabel,
  onSubmit,
  showPlan = true,
}: {
  defaults: BodyStatsDefaults;
  today: string;
  overrides?: Overrides;
  submitLabel: string;
  onSubmit: (input: BodyStatsInput) => Promise<ActionResult | void>;
  showPlan?: boolean;
}) {
  const [v, setV] = useState(defaults);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof BodyStatsDefaults>(k: K, val: BodyStatsDefaults[K]) => {
    setSaved(false);
    setV((s) => ({ ...s, [k]: val }));
  };

  const height = Number(v.height_cm);
  const weight = Number(v.weight_kg);
  const valid = !!v.date_of_birth && height >= 100 && height <= 250 && weight >= 20 && weight <= 400 && v.date_of_birth < today;

  const plan = useMemo(
    () =>
      valid
        ? computeTargets(
            { date_of_birth: v.date_of_birth, sex: v.sex, height_cm: height, activity_level: v.activity_level, goal: v.goal, pace_kg_per_week: v.pace_kg_per_week },
            weight,
            overrides,
            today,
          )
        : null,
    [valid, v, height, weight, overrides, today],
  );

  const submit = () => {
    setError(null);
    start(async () => {
      const res = await onSubmit({
        date_of_birth: v.date_of_birth,
        sex: v.sex,
        height_cm: height,
        weight_kg: weight,
        activity_level: v.activity_level,
        goal: v.goal,
        pace_kg_per_week: v.pace_kg_per_week,
      });
      if (res && !res.ok) setError(res.error ?? "Couldn't save");
      else setSaved(true);
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Weight" unit="kg" value={v.weight_kg} onChange={(x) => set("weight_kg", x)} step="0.1" />
        <NumberField label="Height" unit="cm" value={v.height_cm} onChange={(x) => set("height_cm", x)} step="1" />
        <Card className="p-3">
          <label className="label" htmlFor="dob">
            Date of birth
          </label>
          <input id="dob" type="date" max={today} className="input h-10 px-2" value={v.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
        </Card>
        <Card className="p-3">
          <p className="label">Sex</p>
          <Segmented
            label="Sex"
            value={v.sex}
            onChange={(x) => set("sex", x)}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
        </Card>
      </div>

      <Card className="p-3">
        <p className="label">Activity level</p>
        <div className="grid grid-cols-5 gap-1 rounded-2xl bg-track p-1" role="group" aria-label="Activity level">
          {ACTIVITIES.map((a) => (
            <button
              key={a.value}
              type="button"
              aria-pressed={v.activity_level === a.value}
              onClick={() => set("activity_level", a.value)}
              className="rounded-xl px-1 py-2 text-[0.72rem] leading-tight font-medium text-muted aria-pressed:bg-brand aria-pressed:text-white"
            >
              {a.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">{ACTIVITIES.find((a) => a.value === v.activity_level)?.hint}</p>
      </Card>

      <div className="grid grid-cols-1 gap-3">
        <Card className="p-3">
          <p className="label">Your goal</p>
          <Segmented
            label="Goal"
            value={v.goal}
            onChange={(x) => set("goal", x)}
            options={[
              { value: "lose", label: "Lose" },
              { value: "maintain", label: "Maintain" },
              { value: "gain", label: "Gain" },
            ]}
          />
        </Card>
        {v.goal !== "maintain" && (
          <Card className="p-3">
            <p className="label">Pace (kg per week)</p>
            <Segmented
              label="Pace"
              value={v.pace_kg_per_week}
              onChange={(x) => set("pace_kg_per_week", x)}
              options={[
                { value: 0.25 as Pace, label: "0.25" },
                { value: 0.5 as Pace, label: "0.5" },
                { value: 0.75 as Pace, label: "0.75" },
              ]}
            />
          </Card>
        )}
      </div>

      {showPlan && plan && (
        <Card className="space-y-3">
          <div>
            <h2 className="text-xl font-extrabold">Your estimated plan</h2>
            <p className="text-sm text-muted">Based on your information and selected goal.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatTile icon={<FlameIcon />} tone="flame" label="BMR" value={fmt(plan.bmr)} unit="kcal/day" />
            <StatTile icon={<BarsIcon />} tone="brand" label="Maintenance" value={fmt(plan.tdee)} unit="kcal/day" />
            <StatTile icon={<TargetIcon />} tone="limit" label="Daily limit" value={fmt(plan.kcal)} unit="kcal/day" />
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-line p-3">
            <Macro label="Protein" g={plan.protein_g} kcal={plan.kcal} per={4} color="var(--color-protein)" />
            <Macro label="Carbs" g={plan.carbs_g} kcal={plan.kcal} per={4} color="var(--color-carbs)" />
            <Macro label="Fat" g={plan.fat_g} kcal={plan.kcal} per={9} color="var(--color-fat)" />
          </div>
          <p className="flex items-start gap-2 rounded-xl bg-brand-soft p-3 text-sm text-ink">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            {plan.floored
              ? `Limit raised to safe minimum (${fmt(KCAL_FLOOR[v.sex])} kcal/day).`
              : `We never set a limit below ${fmt(KCAL_FLOOR[v.sex])} kcal/day.`}
          </p>
        </Card>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
      <button type="button" className="btn-primary" disabled={!valid || pending} onClick={submit}>
        {pending ? "Saving…" : saved ? "Saved" : submitLabel}
      </button>
    </div>
  );
}

function Macro({ label, g, kcal, per, color }: { label: string; g: number; kcal: number; per: number; color: string }) {
  const share = kcal > 0 ? Math.round(((g * per) / kcal) * 100) : 0;
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mb-1 font-bold">
        {g}g <span className="text-xs font-normal text-muted">/ {share}%</span>
      </p>
      <Bar value={share} target={100} color={color} />
    </div>
  );
}

function NumberField({ label, unit, value, onChange, step }: { label: string; unit: string; value: string; onChange: (v: string) => void; step: string }) {
  return (
    <Card className="p-3">
      <label className="label">
        {label}
        <div className="mt-1 flex items-baseline gap-2 border-b border-line pb-1">
          <input
            inputMode="decimal"
            type="number"
            step={step}
            className="w-full bg-transparent text-2xl font-bold text-ink outline-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <span className="text-sm text-muted">{unit}</span>
        </div>
      </label>
    </Card>
  );
}
