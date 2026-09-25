import type { ReactNode } from "react";
import { pct } from "@/lib/nutrition";
import type { Totals } from "@/lib/schemas";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function IconBubble({ children, tone }: { children: ReactNode; tone: "flame" | "brand" | "limit" | "danger" }) {
  const tones = {
    flame: "bg-flame-soft text-flame",
    brand: "bg-brand-soft text-brand",
    limit: "bg-limit-soft text-limit",
    danger: "bg-danger-soft text-danger",
  } as const;
  return <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>{children}</span>;
}

export function StatTile({
  icon,
  tone,
  label,
  value,
  unit,
}: {
  icon: ReactNode;
  tone: "flame" | "brand" | "limit";
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="card flex flex-col gap-2 p-3">
      <IconBubble tone={tone}>{icon}</IconBubble>
      <div>
        <p className="text-xs leading-tight text-muted">{label}</p>
        <p className="text-xl font-bold leading-tight">{value}</p>
        {unit && <p className="text-xs text-muted">{unit}</p>}
      </div>
    </div>
  );
}

/**
 * Progress bar. `overAt` is the value/target ratio past which the bar turns
 * red; omit it for targets where going over isn't bad (protein, fibre, …).
 */
export function Bar({ value, target, color, overAt }: { value: number; target: number; color: string; overAt?: number }) {
  const over = overAt !== undefined && target > 0 && value > target * overAt;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-track">
      <div
        className="h-full rounded-full transition-[width]"
        style={{ width: `${pct(value, target)}%`, background: over ? "var(--color-danger)" : color }}
      />
    </div>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Pill({ children, tone }: { children: ReactNode; tone: "brand" | "warn" | "danger" | "muted" }) {
  const tones = {
    brand: "bg-brand-soft text-brand",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger",
    muted: "bg-track text-muted",
  } as const;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-3 pt-2">
      <div>
        <h1 className="h-display">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export const fmt = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
export const fmtKcal = (n: number) => fmt(Math.round(n / 10) * 10);

/** Ratios past which a nutrient counts as "over": the kcal limit (with the ±5% on-target band) and the max limits. */
export const OVER_AT: Partial<Record<keyof Totals, number>> = { kcal: 1.05, sugar_g: 1, sodium_mg: 1 };
