import Link from "next/link";
import { KcalChart, MacroChart, WeightChart } from "@/components/history/Charts";
import { OnTrackCard, RangeToggle, RecentDays } from "@/components/history/parts";
import { BarsIcon, FlameIcon, PlusIcon, TargetIcon } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { fmt, fmtKcal, StatTile } from "@/components/ui";
import { loadHistory } from "@/lib/history";
import { chartTicks, parseRange } from "@/lib/historyMath";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ range?: string | string[] }> }) {
  const range = parseRange((await searchParams).range);
  const h = await loadHistory(range);
  const { summary: s, live } = h;
  const ticks = chartTicks(h.dates, range);
  const chart = { points: h.points, ticks, range };
  // `s` covers completed days only; today's meals still count for charts and the list.
  const anyMeals = h.days.some((d) => d.mealCount > 0);

  return (
    <div className="space-y-3">
      <Logo />
      <h1 className="h-display">History</h1>
      <RangeToggle value={range} />

      {!anyMeals ? (
        <section className="card space-y-3 py-8 text-center">
          <p className="font-bold">Nothing logged in the last {range} days</p>
          <p className="text-sm text-muted">Log a meal and your trends will show up here.</p>
          <Link href="/log" className="btn-outline mx-auto max-w-56">
            <PlusIcon /> Log meal
          </Link>
        </section>
      ) : (
        s.loggedDays > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <StatTile icon={<FlameIcon />} tone="flame" label="Avg calories" value={fmtKcal(s.avgKcal)} unit="kcal/day" />
          <StatTile icon={<BarsIcon />} tone="brand" label="Avg protein" value={`${fmt(s.avgProtein)}g`} unit="/day" />
          <StatTile
            icon={<TargetIcon />}
            tone="brand"
            label="On target"
            value={`${s.onTargetDays} / ${s.loggedDays}`}
            unit="days"
          />
        </div>
        )
      )}

      {live && (
        <div className="grid grid-cols-3 gap-2">
          <StatTile icon={<FlameIcon />} tone="flame" label="BMR" value={fmtKcal(live.bmr)} unit="kcal/day" />
          <StatTile icon={<BarsIcon />} tone="brand" label="Maintenance" value={fmtKcal(live.tdee)} unit="kcal/day" />
          <StatTile icon={<TargetIcon />} tone="limit" label="Daily limit" value={fmtKcal(live.kcal)} unit="kcal/day" />
        </div>
      )}

      {anyMeals && (
        <>
          <KcalChart {...chart} />
          <MacroChart {...chart} />
        </>
      )}
      {(anyMeals || h.hasWeights) && <WeightChart {...chart} current={h.currentWeight} />}

      {s.loggedDays > 0 && <OnTrackCard onTarget={s.onTargetDays} logged={s.loggedDays} />}
      {anyMeals && <RecentDays days={h.days} />}
    </div>
  );
}
