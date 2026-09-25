import Link from "next/link";
import { mealsOn, today } from "@/lib/data";
import { Logo } from "@/components/Logo";
import { PlusIcon } from "@/components/icons";

export default async function HomePage() {
  const meals = await mealsOn(today());
  return (
    <div className="space-y-4">
      <Logo />
      <h1 className="h-display">Today</h1>
      <p className="text-muted">{meals.length} meal(s) logged today.</p>
      <Link href="/log" className="btn-primary">
        <PlusIcon /> Log meal
      </Link>
    </div>
  );
}
