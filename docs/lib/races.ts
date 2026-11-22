import racesJson from "@/data/races.json";
import type { Race, Series, Session } from "./types";
import { addDays, zonedToUtc } from "./time";

export const RACES = (racesJson as Race[]).slice().sort((a, b) => startMs(a) - startMs(b));

const H = 3600_000;

/** How long a session counts as "live" after it starts. */
export function sessionDurationMs(series: Series, name: string): number {
  if (name === "Race") return series === "f1" ? 2.25 * H : 1.25 * H;
  if (name === "Sprint") return 1 * H;
  if (name === "Warm Up") return 0.5 * H;
  return 1 * H;
}

export interface TimedSession extends Session { t: number; endsAt: number }
export function sessionsOf(r: Race): TimedSession[] {
  return (r.sessions ?? []).map((s) => {
    const t = Date.parse(s.utc);
    return { ...s, t, endsAt: t + sessionDurationMs(r.series, s.name) };
  }).sort((a, b) => a.t - b.t);
}

/** Instant the weekend begins: first published session, else venue-local midnight of day one. */
export function startMs(r: Race): number {
  const s = r.sessions?.length ? Math.min(...r.sessions.map((x) => Date.parse(x.utc))) : null;
  return s ?? zonedToUtc(r.start, "00:00", r.tz);
}

/** Instant the weekend is over: after the last session, else venue-local midnight after race day. */
export function endMs(r: Race): number {
  const ss = sessionsOf(r);
  if (ss.length) return ss[ss.length - 1].endsAt + 1 * H;
  return zonedToUtc(addDays(r.raceDate, 1), "00:00", r.tz);
}

export type Phase = "done" | "live" | "upcoming";
export function phaseOf(r: Race, now: number): Phase {
  if (now >= endMs(r)) return "done";
  if (now >= startMs(r)) return "live";
  return "upcoming";
}

export interface NextSession { session: TimedSession; live: boolean }
export function nextSession(r: Race, now: number): NextSession | null {
  for (const s of sessionsOf(r)) {
    if (now < s.endsAt) return { session: s, live: now >= s.t };
  }
  return null;
}

export function racesFor(series: Series | "all"): Race[] {
  return series === "all" ? RACES : RACES.filter((r) => r.series === series);
}

export function nextRace(series: Series, now: number): Race | undefined {
  return RACES.find((r) => r.series === series && phaseOf(r, now) !== "done");
}

/** Two weekends clash when their local date ranges overlap. */
export function overlaps(a: Race, b: Race): boolean {
  return a.start <= b.raceDate && b.start <= a.raceDate;
}
