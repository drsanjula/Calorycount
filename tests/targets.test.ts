import { describe, expect, it } from "vitest";
import { bmr, calorieLimit, computeTargets, macroTargets, tdee, type BodyProfile } from "@/lib/targets";

const male: BodyProfile = {
  date_of_birth: "1998-01-01",
  sex: "male",
  height_cm: 175,
  activity_level: "light",
  goal: "lose",
  pace_kg_per_week: 0.5,
};
const onDate = "2026-09-25"; // age 28

describe("bmr (Mifflin-St Jeor)", () => {
  it("male", () => expect(bmr("male", 68.5, 175, 28)).toBeCloseTo(1643.75));
  it("female", () => expect(bmr("female", 60, 165, 30)).toBeCloseTo(600 + 1031.25 - 150 - 161));
});

describe("tdee", () => {
  it("applies activity multipliers", () => {
    expect(tdee(1000, "sedentary")).toBeCloseTo(1200);
    expect(tdee(1000, "light")).toBeCloseTo(1375);
    expect(tdee(1000, "moderate")).toBeCloseTo(1550);
    expect(tdee(1000, "active")).toBeCloseTo(1725);
    expect(tdee(1000, "very_active")).toBeCloseTo(1900);
  });
});

describe("calorieLimit", () => {
  it("lose subtracts pace × 7700 / 7", () => {
    expect(calorieLimit(2500, "lose", 0.5, "male")).toEqual({ kcal: 1950, floored: false });
  });
  it("gain adds", () => {
    expect(calorieLimit(2500, "gain", 0.25, "male").kcal).toBeCloseTo(2775);
  });
  it("maintain ignores pace", () => {
    expect(calorieLimit(2500, "maintain", 0.75, "male")).toEqual({ kcal: 2500, floored: false });
  });
  it("floors at 1500 for men and 1200 for women", () => {
    expect(calorieLimit(1800, "lose", 0.75, "male")).toEqual({ kcal: 1500, floored: true });
    expect(calorieLimit(1500, "lose", 0.75, "female")).toEqual({ kcal: 1200, floored: true });
  });
});

describe("macroTargets", () => {
  it("uses 1.8 g/kg protein when losing and 1.6 otherwise", () => {
    expect(macroTargets(2000, 70, "lose").protein_g).toBeCloseTo(126);
    expect(macroTargets(2000, 70, "maintain").protein_g).toBeCloseTo(112);
  });
  it("fat 25%, carbs fill the rest, fibre 14/1000, sugar 10%", () => {
    const m = macroTargets(2000, 70, "maintain");
    expect(m.fat_g).toBeCloseTo(500 / 9);
    expect(m.carbs_g).toBeCloseTo((2000 - 112 * 4 - 500) / 4);
    expect(m.fiber_g).toBeCloseTo(28);
    expect(m.sugar_g_max).toBeCloseTo(50);
    expect(m.sodium_mg_max).toBe(2000);
  });
  it("never returns negative carbs", () => {
    expect(macroTargets(1000, 200, "lose").carbs_g).toBe(0);
  });
});

describe("computeTargets", () => {
  it("matches a worked example and rounds (kcal to 10, g to 1)", () => {
    const t = computeTargets(male, 68.5, {}, onDate);
    // BMR 1643.75, TDEE 2260.16, limit 2260.16 - 550 = 1710.16
    expect(t.age).toBe(28);
    expect(t.bmr).toBe(1640);
    expect(t.tdee).toBe(2260);
    expect(t.kcal).toBe(1710);
    expect(t.protein_g).toBe(123); // 68.5 × 1.8 = 123.3
    expect(t.fat_g).toBe(48); // 1710.16 × .25 / 9 = 47.5
    expect(t.carbs_g).toBe(197);
    expect(t.fiber_g).toBe(24);
    expect(t.sugar_g_max).toBe(43);
    expect(t.sodium_mg_max).toBe(2000);
    expect(t.floored).toBe(false);
    expect(Object.values(t.sources).every((s) => s === "auto")).toBe(true);
  });

  it("flags the floor", () => {
    const t = computeTargets({ ...male, sex: "female", height_cm: 150, activity_level: "sedentary", pace_kg_per_week: 0.75 }, 45, {}, onDate);
    expect(t.kcal).toBe(1200);
    expect(t.floored).toBe(true);
  });

  it("kcal override cascades to macros that have no override", () => {
    const t = computeTargets(male, 68.5, { kcal: 2400 }, onDate);
    expect(t.kcal).toBe(2400);
    expect(t.sources.kcal).toBe("custom");
    expect(t.fat_g).toBe(67);
    expect(t.fiber_g).toBe(34);
    expect(t.sugar_g_max).toBe(60);
    expect(t.sources.fat_g).toBe("auto");
    expect(t.floored).toBe(false);
  });

  it("macro overrides win, and carbs fill around overridden protein", () => {
    const t = computeTargets(male, 68.5, { kcal: 2000, protein_g: 150, sodium_mg_max: 1500 }, onDate);
    expect(t.protein_g).toBe(150);
    expect(t.sources.protein_g).toBe("custom");
    expect(t.carbs_g).toBe(Math.round((2000 - 600 - 500) / 4));
    expect(t.sodium_mg_max).toBe(1500);
  });

  it("null overrides mean auto", () => {
    const t = computeTargets(male, 68.5, { kcal: null, protein_g: null }, onDate);
    expect(t.sources.kcal).toBe("auto");
    expect(t.kcal).toBe(1710);
  });

  it("uses the age on the given date", () => {
    expect(computeTargets(male, 68.5, {}, "2026-12-31").age).toBe(28);
    expect(computeTargets(male, 68.5, {}, "2027-01-01").age).toBe(29);
  });
});
