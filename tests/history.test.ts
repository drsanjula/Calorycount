import { describe, expect, it } from "vitest";
import { buildDays, chartTicks, parseRange, rangeDates, summarize, weightByDate } from "@/lib/historyMath";

describe("parseRange", () => {
  it("accepts 7/30/90", () => {
    expect(parseRange("30")).toBe(30);
    expect(parseRange(["90", "7"])).toBe(90);
  });
  it("falls back to 7", () => {
    expect(parseRange(undefined)).toBe(7);
    expect(parseRange("14")).toBe(7);
    expect(parseRange("abc")).toBe(7);
  });
});

describe("rangeDates", () => {
  it("runs today−(n−1) to today, across month ends", () => {
    const d = rangeDates("2026-10-02", 7);
    expect(d).toHaveLength(7);
    expect(d[0]).toBe("2026-09-26");
    expect(d.at(-1)).toBe("2026-10-02");
  });
});

describe("buildDays", () => {
  const dates = ["2026-09-23", "2026-09-24", "2026-09-25"];
  const snaps = new Map([
    ["2026-09-23", 2000],
    ["2026-09-24", 1800],
  ]);
  const meals = [
    { log_date: "2026-09-23", kcal: 1000, protein_g: 50 },
    { log_date: "2026-09-23", kcal: 1050, protein_g: 40 },
    { log_date: "2026-09-25", kcal: 1500, protein_g: 70 },
  ];
  const days = buildDays(dates, meals, snaps, 1700);

  it("sums meals per day and judges against that day's snapshot", () => {
    expect(days[0]).toMatchObject({ mealCount: 2, limit: 2000, limitSource: "snapshot", status: "on_target" });
    expect(days[0].totals.kcal).toBe(2050);
    expect(days[0].totals.protein_g).toBe(90);
  });
  it("keeps a snapshot limit on a day without meals but gives it no status", () => {
    expect(days[1]).toMatchObject({ mealCount: 0, limit: 1800, limitSource: "snapshot", status: null });
    expect(days[1].totals.kcal).toBe(0);
  });
  it("falls back to the live limit when a logged day has no snapshot", () => {
    expect(days[2]).toMatchObject({ limit: 1700, limitSource: "live", status: "near" });
  });
  it("has no limit when neither exists", () => {
    const [d] = buildDays(["2026-09-25"], [{ log_date: "2026-09-25", kcal: 500 }], new Map(), null);
    expect(d).toMatchObject({ limit: null, limitSource: null, status: null });
  });
});

describe("summarize", () => {
  it("averages only over logged days", () => {
    const days = buildDays(
      ["a", "b", "c"],
      [
        { log_date: "a", kcal: 2000, protein_g: 100 },
        { log_date: "c", kcal: 3000, protein_g: 60 },
      ],
      new Map(),
      2000,
    );
    expect(summarize(days)).toEqual({ loggedDays: 2, onTargetDays: 1, avgKcal: 2500, avgProtein: 80 });
  });
  it("is zero for an empty range", () => {
    expect(summarize([])).toEqual({ loggedDays: 0, onTargetDays: 0, avgKcal: 0, avgProtein: 0 });
  });
});

describe("weightByDate", () => {
  it("keeps the latest log of each day", () => {
    const m = weightByDate([
      { log_date: "2026-09-24", logged_at: "2026-09-24T10:00:00Z", weight_kg: 70 },
      { log_date: "2026-09-24", logged_at: "2026-09-24T02:00:00Z", weight_kg: 71 },
      { log_date: "2026-09-25", logged_at: "2026-09-25T02:00:00Z", weight_kg: 69.5 },
    ]);
    expect(m.get("2026-09-24")).toBe(70);
    expect(m.get("2026-09-25")).toBe(69.5);
  });
});

describe("chartTicks", () => {
  it("labels every day for 7", () => {
    expect(chartTicks(rangeDates("2026-09-25", 7), 7)).toHaveLength(7);
  });
  it("steps back from today for 30 and 90", () => {
    const t30 = chartTicks(rangeDates("2026-09-25", 30), 30);
    expect(t30.at(-1)).toBe("2026-09-25");
    expect(t30).toEqual(["2026-08-28", "2026-09-04", "2026-09-11", "2026-09-18", "2026-09-25"]);
    const t90 = chartTicks(rangeDates("2026-09-25", 90), 90);
    expect(t90).toHaveLength(6);
    expect(t90.at(-1)).toBe("2026-09-25");
  });
});
