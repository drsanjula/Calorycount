import { Bar, Card, fmt } from "@/components/ui";
import type { Totals } from "@/lib/schemas";
import type { TargetsSnapshot } from "@/lib/targets";

const MACROS = [
  { key: "protein_g", target: "protein_g", label: "Protein", color: "var(--color-protein)" },
  { key: "carbs_g", target: "carbs_g", label: "Carbs", color: "var(--color-carbs)" },
  { key: "fat_g", target: "fat_g", label: "Fat", color: "var(--color-fat)" },
  { key: "fiber_g", target: "fiber_g", label: "Fibre", color: "var(--color-fibre)" },
] as const;

export function MacroCard({ totals, targets }: { totals: Totals; targets: TargetsSnapshot }) {
  return (
    <Card>
      <h2 className="text-lg font-bold">Macros</h2>
      <div className="mt-3 grid grid-cols-4 divide-x divide-line">
        {MACROS.map((m) => (
          <div key={m.key} className="space-y-1.5 px-2 first:pl-0 last:pr-0">
            <p className="text-xs text-muted">{m.label}</p>
            <p className="leading-tight">
              <b>{fmt(totals[m.key])}g</b>
              <span className="block text-xs text-muted">of {fmt(targets[m.target])}g</span>
            </p>
            <Bar value={totals[m.key]} target={targets[m.target]} color={m.color} />
          </div>
        ))}
      </div>
    </Card>
  );
}

const CubeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinejoin="round" aria-hidden>
    <path d="M12 3 4 7.5v9L12 21l8-4.5v-9Z" />
    <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
  </svg>
);
const ShakerIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinejoin="round" aria-hidden>
    <path d="M9 4h6l1 5H8Z" />
    <path d="M8 9h8l1 11H7Z" />
    <path d="M11 13v.01M13 15v.01M11 17v.01" strokeLinecap="round" />
  </svg>
);

export function SugarSodiumCard({ totals, targets }: { totals: Totals; targets: TargetsSnapshot }) {
  const rows = [
    { label: "Sugar", icon: <CubeIcon />, value: totals.sugar_g, max: targets.sugar_g_max, unit: "g", color: "var(--color-sugar)" },
    { label: "Sodium", icon: <ShakerIcon />, value: totals.sodium_mg, max: targets.sodium_mg_max, unit: "mg", color: "var(--color-sodium)" },
  ];
  return (
    <Card>
      <h2 className="text-lg font-bold">Sugar &amp; Sodium</h2>
      <div className="mt-3 grid grid-cols-2 divide-x divide-line">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 px-3 first:pl-0 last:pr-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-track text-ink">{r.icon}</span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-xs text-muted">{r.label}</p>
              <p className="leading-tight">
                <b>
                  {fmt(r.value)}
                  {r.unit}
                </b>
                <span className="block text-xs text-muted">
                  of {fmt(r.max)}
                  {r.unit} max
                </span>
              </p>
              <Bar value={r.value} target={r.max} color={r.color} overAt={1} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
