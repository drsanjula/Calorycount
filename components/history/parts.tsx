import Link from "next/link";
import type { DayStatus } from "@/lib/nutrition";
import { pct } from "@/lib/nutrition";
import { RANGES, type DayRow, type Range } from "@/lib/historyMath";
import { formatDay } from "@/lib/time";
import { CheckIcon, ChevronRight, InfoIcon } from "@/components/icons";
import { fmtKcal, Pill } from "@/components/ui";

export const STATUS: Record<DayStatus, { label: string; tone: "brand" | "warn" | "danger" | "muted"; color: string }> = {
  on_target: { label: "On target", tone: "brand", color: "var(--color-protein)" },
  near: { label: "Near", tone: "warn", color: "var(--color-carbs)" },
  over: { label: "Over", tone: "danger", color: "var(--color-danger)" },
  under: { label: "Under", tone: "muted", color: "var(--color-muted)" },
};

export function StatusPill({ status }: { status: DayStatus }) {
  const s = STATUS[status];
  return (
    <Pill tone={s.tone}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {s.label}
    </Pill>
  );
}

/** 7 / 30 / 90 toggle; plain links so the range lives in the URL. */
export function RangeToggle({ value }: { value: Range }) {
  return (
    <nav className="seg" aria-label="Range">
      {RANGES.map((r) => (
        <Link
          key={r}
          href={`/history?range=${r}`}
          aria-current={r === value ? "page" : undefined}
          className={`flex-1 rounded-full px-3 py-2 text-center text-sm font-medium transition ${
            r === value ? "bg-brand text-white shadow-sm" : "text-muted"
          }`}
        >
          {r} days
        </Link>
      ))}
    </nav>
  );
}

export function OnTrackCard({ onTarget, logged }: { onTarget: number; logged: number }) {
  const good = logged > 0 && onTarget / logged >= 0.5;
  return (
    <section className={`card flex items-center gap-3 ${good ? "bg-brand-soft" : ""}`}>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          good ? "bg-brand text-white" : "bg-track text-muted"
        }`}
      >
        {good ? <CheckIcon /> : <InfoIcon />}
      </span>
      <div>
        <p className="font-bold">{good ? "You're on track!" : "Room to improve"}</p>
        <p className="text-sm text-muted">
          You hit your calorie goal on {onTarget} of {logged} logged {logged === 1 ? "day" : "days"}.
        </p>
      </div>
    </section>
  );
}

function DayProgress({ kcal, limit, status }: { kcal: number; limit: number; status: DayStatus }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-track">
      <div className="h-full rounded-full" style={{ width: `${pct(kcal, limit)}%`, background: STATUS[status].color }} />
    </div>
  );
}

/** Logged days, newest first, each judged against its own snapshot. */
export function RecentDays({ days }: { days: DayRow[] }) {
  // The range always ends today; today is still in progress, so it gets no verdict.
  const today = days.at(-1)?.date;
  const logged = days.filter((d) => d.mealCount > 0).reverse();
  const anyLive = logged.some((d) => d.limitSource === "live");
  return (
    <section className="card pb-2">
      <h2 className="text-lg font-bold">Recent days</h2>
      <ul className="mt-1 divide-y divide-line">
        {logged.map((d) => (
          <li key={d.date}>
            <Link href={`/history/${d.date}`} className="flex items-center gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2 whitespace-nowrap">
                  <span className="text-sm font-semibold">{formatDay(d.date)}</span>
                  <span className="text-sm tabular-nums">
                    {fmtKcal(d.totals.kcal)}
                    {d.limit !== null && (
                      <span className="text-muted">
                        {" "}
                        / {fmtKcal(d.limit)}
                        {d.limitSource === "live" && <sup title="No snapshot for this day; current limit shown">*</sup>}
                      </span>
                    )}{" "}
                    <span className="text-xs text-muted">kcal</span>
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="flex-1">
                    {d.limit !== null && d.status && <DayProgress kcal={d.totals.kcal} limit={d.limit} status={d.status} />}
                  </div>
                  <span className="flex w-[5.5rem] shrink-0 justify-end whitespace-nowrap">
                    {d.date === today ? <Pill tone="muted">Today</Pill> : d.status && <StatusPill status={d.status} />}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
      {anyLive && <p className="pt-1 pb-1 text-xs text-muted">* No snapshot that day; judged against your current limit.</p>}
    </section>
  );
}
