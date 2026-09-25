/**
 * Day-boundary helpers. Every "today"/"yesterday" decision goes through these
 * with the app timezone (Asia/Colombo), never UTC or server-local time.
 */
export const DEFAULT_TZ = "Asia/Colombo";

export type MealLabel = "breakfast" | "lunch" | "dinner" | "snack";

/** YYYY-MM-DD of `d` as seen in `tz`. */
export function dateInTz(d: Date, tz: string = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Hour (0–23) of `d` as seen in `tz`. */
export function hourInTz(d: Date, tz: string = DEFAULT_TZ): number {
  const h = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(d);
  return Number(h);
}

/** Calendar arithmetic on a YYYY-MM-DD string. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

export function todayIn(tz: string = DEFAULT_TZ, now: Date = new Date()): string {
  return dateInTz(now, tz);
}

export function yesterdayIn(tz: string = DEFAULT_TZ, now: Date = new Date()): string {
  return addDays(dateInTz(now, tz), -1);
}

/** Inclusive list of dates from `start` to `end`. */
export function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

export function mealLabelForHour(hour: number): MealLabel {
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 18 && hour < 23) return "dinner";
  return "snack";
}

export function formatTime(iso: string, tz: string = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

/** "Sun, Apr 14" for a YYYY-MM-DD string. */
export function formatDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/** "Mon" for a YYYY-MM-DD string. */
export function formatWeekday(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function ageOn(dob: string, onDate: string): number {
  const [by, bm, bd] = dob.split("-").map(Number);
  const [y, m, d] = onDate.split("-").map(Number);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age -= 1;
  return age;
}
