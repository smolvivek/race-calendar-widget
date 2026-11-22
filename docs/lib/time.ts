/**
 * Time handling. The rule for the whole app: a moment is a UTC millisecond
 * value. Dates in the data are venue-local calendar days; they only become
 * moments through `zonedToUtc`, with the venue's IANA zone. Nothing here ever
 * compares a date string against the viewer's clock.
 */

const dtfCache = new Map<string, Intl.DateTimeFormat>();
function dtf(tz: string): Intl.DateTimeFormat {
  let f = dtfCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23",
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric",
    });
    dtfCache.set(tz, f);
  }
  return f;
}

/** Offset of `tz` from UTC at the given instant, in ms (positive = east of UTC). */
export function tzOffsetMs(utcMs: number, tz: string): number {
  const p: Record<string, number> = {};
  for (const part of dtf(tz).formatToParts(new Date(utcMs))) {
    if (part.type !== "literal") p[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** Venue-local wall-clock date + time -> UTC instant. Handles DST edges. */
export function zonedToUtc(date: string, time: string, tz: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const off1 = tzOffsetMs(guess, tz);
  let t = guess - off1;
  const off2 = tzOffsetMs(t, tz);
  if (off2 !== off1) t = guess - off2;
  return t;
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

/** Calendar day (YYYY-MM-DD) an instant falls on in `tz`. */
export function localDate(utcMs: number, tz: string): string {
  const p: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(utcMs))) {
    p[part.type] = part.value;
  }
  return `${p.year}-${p.month}-${p.day}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface DayParts { weekday: string; day: number; month: string; monthIndex: number; year: number }
/** Pure calendar arithmetic on a YYYY-MM-DD string. No time zones involved. */
export function dayParts(date: string): DayParts {
  const [y, m, d] = date.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { weekday: WEEKDAYS[wd], day: d, month: MONTHS[m - 1], monthIndex: m - 1, year: y };
}

export function formatDay(date: string): string {
  const p = dayParts(date);
  return `${p.weekday} ${p.day} ${p.month}`;
}

export function formatRange(start: string, end: string): string {
  const a = dayParts(start), b = dayParts(end);
  return a.monthIndex === b.monthIndex ? `${a.day}–${b.day} ${a.month}` : `${a.day} ${a.month} – ${b.day} ${b.month}`;
}

/** "Sun 15:10" style label for an instant, in the given zone. */
export function formatInstant(utcMs: number, tz: string, withZone = false): string {
  const parts = new Intl.DateTimeFormat(undefined, {
    timeZone: tz, weekday: "short", hour: "numeric", minute: "2-digit",
    ...(withZone ? { timeZoneName: "short" as const } : {}),
  }).format(new Date(utcMs));
  return parts;
}

export function zoneLabel(utcMs: number, tz: string): string {
  const part = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" })
    .formatToParts(new Date(utcMs)).find((x) => x.type === "timeZoneName");
  return part ? part.value : tz;
}

export function viewerZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; }
}

export interface Countdown { days: number; hours: number; minutes: number; seconds: number; totalMs: number }
export function countdown(targetMs: number, nowMs: number): Countdown {
  const totalMs = Math.max(0, targetMs - nowMs);
  const s = Math.floor(totalMs / 1000);
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60, totalMs };
}

/** Whole days from date a to date b (both YYYY-MM-DD). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}
