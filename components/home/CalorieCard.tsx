import { BarsIcon, FlameIcon, InfoIcon, TargetIcon } from "@/components/icons";
import { Card, fmtKcal, StatTile } from "@/components/ui";
import { pct } from "@/lib/nutrition";
import type { TargetsSnapshot } from "@/lib/targets";
import { Ring } from "./Ring";

export function CalorieCard({ consumed, limit, floored }: { consumed: number; limit: number; floored: boolean }) {
  const over = consumed > limit;
  const remaining = limit - consumed;
  return (
    <Card>
      <div className="flex items-center gap-4">
        <Ring value={pct(consumed, limit)} color={over ? "var(--color-danger)" : "var(--color-protein)"} size={112}>
          <span className="text-3xl font-extrabold leading-none">{fmtKcal(consumed)}</span>
          <span className="mt-1 text-xs text-muted">of {fmtKcal(limit)} kcal</span>
        </Ring>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">Calories</h2>
          <dl className="mt-2 grid grid-cols-3 divide-x divide-line">
            <div className="pr-2">
              <dd className="text-base font-bold leading-tight">{fmtKcal(consumed)}</dd>
              <dt className="text-xs text-muted">Consumed</dt>
            </div>
            <div className="px-2">
              <dd className={`text-base font-bold leading-tight ${over ? "text-danger" : ""}`}>{fmtKcal(Math.abs(remaining))}</dd>
              <dt className={`text-xs ${over ? "font-semibold text-danger" : "text-muted"}`}>{over ? "Over by" : "Remaining"}</dt>
            </div>
            <div className="pl-2">
              <dd className="text-base font-bold leading-tight">{fmtKcal(limit)}</dd>
              <dt className="text-xs text-muted">Limit</dt>
            </div>
          </dl>
        </div>
      </div>
      {over && (
        <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          Over by {fmtKcal(-remaining)} kcal today
        </p>
      )}
      {floored && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">
          <InfoIcon className="h-4 w-4 shrink-0" /> Limit raised to safe minimum
        </p>
      )}
    </Card>
  );
}

export function TargetStrip({ targets }: { targets: TargetsSnapshot }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatTile icon={<FlameIcon />} tone="flame" label="BMR" value={fmtKcal(targets.bmr)} unit="kcal/day" />
      <StatTile icon={<BarsIcon />} tone="brand" label="Maintenance" value={fmtKcal(targets.tdee)} unit="kcal/day" />
      <StatTile icon={<TargetIcon />} tone="limit" label="Daily limit" value={fmtKcal(targets.kcal)} unit="kcal/day" />
    </div>
  );
}
