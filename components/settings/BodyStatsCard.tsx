"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { updateBodyStats } from "@/app/profileActions";
import { BodyStatsForm, type BodyStatsDefaults } from "@/components/BodyStatsForm";
import { ChevronRight, ScaleIcon, TargetIcon } from "@/components/icons";
import { Card, fmt } from "@/components/ui";
import type { BodyStatsInput } from "@/lib/schemas";
import type { Overrides } from "@/lib/targets";
import { CakeIcon, PersonIcon, RulerIcon } from "./icons";

const GOAL_LABEL = { lose: "Lose", maintain: "Maintain", gain: "Gain" } as const;

export function BodyStatsCard({
  defaults,
  age,
  today,
  overrides,
}: {
  defaults: BodyStatsDefaults;
  age: number;
  today: string;
  overrides: Overrides;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  const submit = async (input: BodyStatsInput) => {
    const res = await updateBodyStats(input);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
    return res;
  };

  const goalSub = defaults.goal === "maintain" ? "weight" : `${defaults.pace_kg_per_week} kg/wk`;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Body stats &amp; goal</h2>
        <button type="button" className="btn-ghost" aria-expanded={editing} onClick={() => setEditing((e) => !e)}>
          {editing ? "Cancel" : "Edit"} {!editing && <ChevronRight />}
        </button>
      </div>

      {!editing && (
        <dl className="mt-4 grid grid-cols-5 divide-x divide-line text-center">
          <Stat icon={<CakeIcon />} label="Age" value={String(age)} sub="years" />
          <Stat icon={<PersonIcon />} label="Sex" value={defaults.sex === "male" ? "Male" : "Female"} />
          <Stat icon={<RulerIcon />} label="Height" value={defaults.height_cm} sub="cm" />
          <Stat icon={<ScaleIcon className="h-6 w-6" />} label="Weight" value={fmt(Number(defaults.weight_kg), 1)} sub="kg" />
          <Stat icon={<TargetIcon className="h-6 w-6" />} label="Goal" value={GOAL_LABEL[defaults.goal]} sub={goalSub} />
        </dl>
      )}

      {editing && (
        <div className="mt-4">
          <BodyStatsForm defaults={defaults} today={today} overrides={overrides} submitLabel="Save changes" onSubmit={submit} showPlan />
        </div>
      )}
    </Card>
  );
}

function Stat({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center px-1">
      <span className="text-muted">{icon}</span>
      <dt className="mt-1 text-xs text-muted">{label}</dt>
      <dd className="truncate text-base font-bold leading-tight">{value}</dd>
      {sub && <dd className="text-xs text-muted">{sub}</dd>}
    </div>
  );
}
