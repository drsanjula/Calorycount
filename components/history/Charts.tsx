"use client";

import type { ComponentProps, ReactNode } from "react";
import { Area, AreaChart, Bar, CartesianGrid, ComposedChart, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartPoint, Range } from "@/lib/historyMath";
import { formatDay, formatWeekday } from "@/lib/time";
import { fmt, fmtKcal } from "@/components/ui";

const C = {
  kcal: "var(--color-brand)",
  limit: "var(--color-limit)",
  protein: "var(--color-protein)",
  carbs: "var(--color-carbs)",
  fat: "var(--color-fat)",
  weight: "var(--color-brand)",
  grid: "var(--color-line)",
  muted: "var(--color-muted)",
  surface: "var(--color-surface)",
};

const HEIGHT = 170;
const MARGIN = { top: 8, right: 18, bottom: 0, left: 0 };

interface ChartProps {
  points: ChartPoint[];
  ticks: string[];
  range: Range;
}

/** "Mon" for the 7-day view, "Sep 25" otherwise. */
function tickLabel(range: Range) {
  return (date: string) => (range === 7 ? formatWeekday(date) : formatDay(date).split(", ")[1]);
}

function xAxis({ ticks, range }: ChartProps) {
  return (
    <XAxis
      dataKey="date"
      ticks={ticks}
      interval={0}
      tickFormatter={tickLabel(range)}
      tick={{ fill: C.muted, fontSize: 11 }}
      tickLine={false}
      axisLine={{ stroke: C.grid }}
      tickMargin={6}
    />
  );
}

function yAxis(width = 38, extra: Partial<ComponentProps<typeof YAxis>> = {}) {
  return (
    <YAxis
      width={width}
      tick={{ fill: C.muted, fontSize: 11 }}
      tickLine={false}
      axisLine={false}
      tickCount={4}
      tickFormatter={(v: number) => fmt(v)}
      {...extra}
    />
  );
}

const grid = <CartesianGrid vertical={false} stroke={C.grid} />;

/* ---------- tooltip ---------- */

type TipRow = { color: string; label: string; value: string; dashed?: boolean; bar?: boolean };

function TipBox({ date, rows }: { date: string; rows: TipRow[] }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-[var(--shadow-card)]">
      <p className="mb-1 font-semibold text-ink">{formatDay(date)}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2 text-muted">
          <Swatch color={r.color} dashed={r.dashed} bar={r.bar} />
          {r.label}
          <span className="ml-auto pl-3 font-semibold tabular-nums text-ink">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

/** `band`: no crosshair on the bar chart; the tooltip alone marks the day. */
function tooltip(rowsFor: (p: ChartPoint) => TipRow[], band = false) {
  return (
    <Tooltip
      cursor={band ? false : { stroke: C.grid, strokeWidth: 1 }}
      isAnimationActive={false}
      content={({ active, payload }) => {
        const p = payload?.[0]?.payload as ChartPoint | undefined;
        if (!active || !p) return null;
        const rows = rowsFor(p);
        return rows.length ? <TipBox date={p.date} rows={rows} /> : null;
      }}
    />
  );
}

/* ---------- chrome ---------- */

function Swatch({ color, dashed, bar }: { color: string; dashed?: boolean; bar?: boolean }) {
  if (bar) return <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: color }} />;
  if (dashed) return <span className="w-3.5 shrink-0 border-t-2 border-dashed" style={{ borderColor: color }} />;
  return <span className="h-0.5 w-3.5 shrink-0 rounded-full" style={{ background: color }} />;
}

function Legend({ items }: { items: { color: string; label: string; dashed?: boolean; bar?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <Swatch color={i.color} dashed={i.dashed} bar={i.bar} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export function ChartCard({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="card px-3 pt-3 pb-2">
      <header className="mb-2 flex items-start justify-between gap-3 px-1">
        <h2 className="shrink-0 text-lg font-bold leading-tight">{title}</h2>
        {right}
      </header>
      {children}
    </section>
  );
}

/* ---------- charts ---------- */

export function KcalChart(props: ChartProps) {
  const { points, range } = props;
  return (
    <ChartCard
      title="Calories"
      right={
        <Legend
          items={[
            { color: C.kcal, label: "Eaten", bar: true },
            { color: C.limit, label: "Daily limit", dashed: true },
          ]}
        />
      }
    >
      <ComposedChart responsive data={points} margin={MARGIN} style={{ width: "100%", height: HEIGHT }} barCategoryGap="25%">
        {grid}
        {xAxis(props)}
        {yAxis(38, { domain: [0, "auto"] })}
        {tooltip((p) => [
          ...(p.kcal !== null ? [{ color: C.kcal, label: "Eaten", value: `${fmtKcal(p.kcal)} kcal`, bar: true }] : []),
          ...(p.limit !== null ? [{ color: C.limit, label: "Limit", value: `${fmtKcal(p.limit)} kcal`, dashed: true }] : []),
        ], true)}
        <Bar
          dataKey="kcal"
          fill={C.kcal}
          maxBarSize={24}
          radius={range === 90 ? [1, 1, 0, 0] : [4, 4, 0, 0]}
          isAnimationActive={false}
        />
        <Line
          dataKey="limit"
          type="step"
          stroke={C.limit}
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
          activeDot={false}
          connectNulls
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartCard>
  );
}

const MACROS = [
  { key: "protein_g", label: "Protein", color: C.protein },
  { key: "carbs_g", label: "Carbs", color: C.carbs },
  { key: "fat_g", label: "Fat", color: C.fat },
] as const;

export function MacroChart(props: ChartProps) {
  const { points, range } = props;
  // Dots only where there is room for them; the tooltip carries values otherwise.
  const dot = range === 7 ? { r: 3.5, strokeWidth: 2, stroke: C.surface } : false;
  return (
    <ChartCard title="Macros" right={<Legend items={MACROS.map((m) => ({ color: m.color, label: m.label }))} />}>
      <LineChart responsive data={points} margin={MARGIN} style={{ width: "100%", height: HEIGHT }}>
        {grid}
        {xAxis(props)}
        {yAxis(38, { domain: [0, "auto"], unit: "g" })}
        {tooltip((p) =>
          p.protein_g === null
            ? []
            : MACROS.map((m) => ({ color: m.color, label: m.label, value: `${fmt(p[m.key] ?? 0)} g` })),
        )}
        {MACROS.map((m) => (
          <Line
            key={m.key}
            dataKey={m.key}
            name={m.label}
            type="monotone"
            stroke={m.color}
            fill={m.color}
            strokeWidth={2}
            dot={dot && { ...dot, fill: m.color }}
            activeDot={{ r: 4.5, strokeWidth: 2, stroke: C.surface, fill: m.color }}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ChartCard>
  );
}

export function WeightChart(props: ChartProps & { current: number | null }) {
  const { points, range, current } = props;
  const values = points.map((p) => p.weight_kg).filter((w): w is number => w !== null);
  const count = values.length;
  const lo = Math.floor(Math.min(...values) - 0.5);
  const hi = Math.ceil(Math.max(...values) + 0.5);
  return (
    <ChartCard
      title="Weight"
      right={
        current !== null && (
          <p className="text-xs text-muted">
            Current <span className="text-base font-bold text-ink">{fmt(current, 1)} kg</span>
          </p>
        )
      }
    >
      {count === 0 ? (
        <p className="px-1 pb-3 text-sm text-muted">No weigh-ins in the last {range} days.</p>
      ) : (
        <AreaChart responsive data={points} margin={MARGIN} style={{ width: "100%", height: HEIGHT - 20 }}>
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.weight} stopOpacity={0.16} />
              <stop offset="100%" stopColor={C.weight} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {grid}
          {xAxis(props)}
          {yAxis(38, { domain: [lo, hi], allowDecimals: false })}
          {tooltip((p) =>
            p.weight_kg === null ? [] : [{ color: C.weight, label: "Weight", value: `${fmt(p.weight_kg, 1)} kg` }],
          )}
          <Area
            dataKey="weight_kg"
            type="monotone"
            stroke={C.weight}
            strokeWidth={2}
            fill="url(#weightFill)"
            baseValue={lo}
            dot={count <= 31 ? { r: 3.5, strokeWidth: 2, stroke: C.surface, fill: C.weight } : false}
            activeDot={{ r: 4.5, strokeWidth: 2, stroke: C.surface, fill: C.weight }}
            connectNulls
            isAnimationActive={false}
          />
        </AreaChart>
      )}
    </ChartCard>
  );
}
