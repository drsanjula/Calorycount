import Link from "next/link";
import { CalorieCard, TargetStrip } from "@/components/home/CalorieCard";
import { MealList } from "@/components/home/MealList";
import { MacroCard, SugarSodiumCard } from "@/components/home/NutrientCards";
import { WeightCard } from "@/components/home/WeightCard";
import { YesterdayReview } from "@/components/home/YesterdayReview";
import { PlusIcon } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { Card } from "@/components/ui";
import { getReview, getSnapshot, hasMealsOn, latestWeight, liveTargets, mealsOn, today, tz, yesterday } from "@/lib/data";
import { sumTotals } from "@/lib/nutrition";
import { hourInTz } from "@/lib/time";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
  const day = today();
  const prev = yesterday();
  const [meals, snapshot, weight, prevHasMeals, prevReview] = await Promise.all([
    mealsOn(day),
    getSnapshot(day),
    latestWeight(),
    hasMealsOn(prev),
    getReview(prev),
  ]);
  // Today's snapshot once the first meal is saved; live targets before that.
  const targets = snapshot ?? (await liveTargets());
  const totals = sumTotals(meals);

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="pt-2">
          <Logo />
        </div>
        <WeightCard weightKg={weight} />
      </header>

      <div>
        <p className="text-muted">{greeting(hourInTz(new Date(), tz()))}</p>
        <h1 className="h-display">Fuel your day</h1>
        <p className="mt-1 text-muted">Stay consistent, make progress.</p>
      </div>

      <YesterdayReview
        key={prev}
        date={prev}
        hasMeals={prevHasMeals}
        initialReview={
          prevReview && {
            score: prevReview.score,
            summary: prevReview.summary,
            wins: prevReview.wins,
            improvements: prevReview.improvements,
            tomorrow_tip: prevReview.tomorrow_tip,
          }
        }
      />

      {targets ? (
        <>
          <CalorieCard consumed={totals.kcal} limit={targets.kcal} floored={targets.floored} />
          <TargetStrip targets={targets} />
          <MacroCard totals={totals} targets={targets} />
          <SugarSodiumCard totals={totals} targets={targets} />
        </>
      ) : (
        <Card>
          <p className="text-sm text-muted">
            Add your body stats in <Link href="/settings" className="font-semibold text-brand">Settings</Link> to see your targets.
          </p>
        </Card>
      )}

      <MealList meals={meals} tz={tz()} />

      <Link href="/log" className="btn-primary">
        <PlusIcon /> Log meal
      </Link>
    </div>
  );
}
