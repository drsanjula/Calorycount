import { describe, expect, it } from "vitest";
import { average, dayStatus, pct, sumItems, sumTotals } from "@/lib/nutrition";
import type { MealItem } from "@/lib/schemas";

const item = (over: Partial<MealItem>): MealItem => ({
  name: "x",
  quantity: 1,
  unit: "g",
  grams: 100,
  kcal: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fiber_g: 0,
  sugar_g: 0,
  sodium_mg: 0,
  ...over,
});

describe("sumItems", () => {
  it("sums every nutrient", () => {
    const t = sumItems([
      item({ kcal: 198, protein_g: 37, fat_g: 4 }),
      item({ kcal: 112, protein_g: 1, carbs_g: 6, fat_g: 10, fiber_g: 5 }),
      item({ kcal: 120.4, carbs_g: 21.25, sodium_mg: 320, sugar_g: 0.33 }),
    ]);
    expect(t).toEqual({ kcal: 430.4, protein_g: 38, carbs_g: 27.3, fat_g: 14, fiber_g: 5, sugar_g: 0.3, sodium_mg: 320 });
  });
  it("empty list is zero", () => {
    expect(sumItems([]).kcal).toBe(0);
  });
});

describe("sumTotals", () => {
  it("accepts numeric strings from Postgres numeric columns and ignores nulls", () => {
    expect(sumTotals([{ kcal: "450.5", protein_g: null }, { kcal: 100 }]).kcal).toBe(550.5);
  });
});

describe("dayStatus", () => {
  it("on target within ±5%", () => {
    expect(dayStatus(1800, 1800)).toBe("on_target");
    expect(dayStatus(1890, 1800)).toBe("on_target");
    expect(dayStatus(1710, 1800)).toBe("on_target");
  });
  it("near within ±15%", () => {
    expect(dayStatus(1950, 1800)).toBe("near");
    expect(dayStatus(1600, 1800)).toBe("near");
  });
  it("beyond 15%", () => {
    expect(dayStatus(2100, 1800)).toBe("over");
    expect(dayStatus(1000, 1800)).toBe("under");
  });
});

describe("helpers", () => {
  it("pct clamps", () => {
    expect(pct(50, 100)).toBe(50);
    expect(pct(150, 100)).toBe(100);
    expect(pct(10, 0)).toBe(0);
  });
  it("average", () => {
    expect(average([])).toBe(0);
    expect(average([1, 2, 3])).toBe(2);
  });
});
