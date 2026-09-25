import { describe, expect, it } from "vitest";
import { addDays, dateInTz, mealLabelForHour, yesterdayIn } from "@/lib/time";

describe("Colombo day boundaries", () => {
  it("uses Colombo (UTC+5:30), not UTC", () => {
    // 2026-09-24T19:00Z is 00:30 on the 25th in Colombo
    expect(dateInTz(new Date("2026-09-24T19:00:00Z"), "Asia/Colombo")).toBe("2026-09-25");
    expect(dateInTz(new Date("2026-09-24T18:00:00Z"), "Asia/Colombo")).toBe("2026-09-24");
  });
  it("yesterday", () => {
    expect(yesterdayIn("Asia/Colombo", new Date("2026-03-01T00:00:00Z"))).toBe("2026-02-28");
  });
  it("addDays crosses months and years", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("meal labels", () => {
    expect(mealLabelForHour(8)).toBe("breakfast");
    expect(mealLabelForHour(13)).toBe("lunch");
    expect(mealLabelForHour(16)).toBe("snack");
    expect(mealLabelForHour(20)).toBe("dinner");
    expect(mealLabelForHour(2)).toBe("snack");
  });
});
