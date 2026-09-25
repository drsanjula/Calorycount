import type { MealItem } from "@/lib/schemas";
import { fmt } from "./ui";

export function MealItemRow({ item }: { item: MealItem }) {
  return (
    <li className="py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold">{item.name}</p>
        <p className="shrink-0 font-bold">{fmt(item.kcal)} kcal</p>
      </div>
      <p className="text-sm text-muted">
        {fmt(item.quantity, 2)} {item.unit} · {fmt(item.grams)} g
      </p>
      <p className="mt-1 flex flex-wrap gap-x-3 text-sm">
        <span>
          <b className="text-protein">P</b> {fmt(item.protein_g)}g
        </span>
        <span>
          <b className="text-carbs">C</b> {fmt(item.carbs_g)}g
        </span>
        <span>
          <b className="text-fat">F</b> {fmt(item.fat_g)}g
        </span>
        <span>
          <b className="text-fibre">Fi</b> {fmt(item.fiber_g)}g
        </span>
      </p>
    </li>
  );
}
