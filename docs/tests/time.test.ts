import { describe, it, expect } from "vitest";
import { zonedToUtc, addDays, localDate, dayParts, formatDay, formatRange, countdown } from "@/lib/time";
import { RACES, phaseOf, startMs, endMs, nextRace, nextSession, overlaps } from "@/lib/races";

const iso = (ms: number) => new Date(ms).toISOString();

describe("zonedToUtc", () => {
  it("converts venue-local wall time to UTC", () => {
    expect(iso(zonedToUtc("2026-11-21", "20:00", "America/Los_Angeles"))).toBe("2026-11-22T04:00:00.000Z"); // Vegas race
    expect(iso(zonedToUtc("2026-11-22", "14:00", "Europe/Lisbon"))).toBe("2026-11-22T14:00:00.000Z");
    expect(iso(zonedToUtc("2026-03-08", "15:00", "Australia/Melbourne"))).toBe("2026-03-08T04:00:00.000Z"); // AEDT +11
    expect(iso(zonedToUtc("2026-06-14", "15:00", "Europe/Madrid"))).toBe("2026-06-14T13:00:00.000Z"); // CEST +2
  });
  it("handles the DST switch day", () => {
    // US clocks go back on 2026-11-01: 00:00 local is still PDT (UTC-7)
    expect(iso(zonedToUtc("2026-11-01", "00:00", "America/Los_Angeles"))).toBe("2026-11-01T07:00:00.000Z");
    expect(iso(zonedToUtc("2026-11-02", "00:00", "America/Los_Angeles"))).toBe("2026-11-02T08:00:00.000Z");
  });
  it("handles half-hour and unusual zones", () => {
    expect(iso(zonedToUtc("2026-11-22", "12:00", "Asia/Kolkata"))).toBe("2026-11-22T06:30:00.000Z");
    expect(iso(zonedToUtc("2027-11-14", "12:00", "Australia/Adelaide"))).toBe("2027-11-14T01:30:00.000Z");
  });
});

describe("date helpers", () => {
  it("adds days across month and year ends", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });
  it("names weekdays without touching time zones", () => {
    expect(formatDay("2026-11-22")).toBe("Sun 22 Nov");
    expect(formatDay("2026-11-21")).toBe("Sat 21 Nov");
    expect(formatRange("2026-11-19", "2026-11-21")).toBe("19–21 Nov");
    expect(formatRange("2026-10-30", "2026-11-01")).toBe("30 Oct – 1 Nov");
    expect(dayParts("2027-11-20").weekday).toBe("Sat");
  });
  it("finds the local calendar day of an instant", () => {
    expect(localDate(Date.parse("2026-11-22T04:00:00Z"), "America/Los_Angeles")).toBe("2026-11-21");
    expect(localDate(Date.parse("2026-11-22T04:00:00Z"), "Asia/Kolkata")).toBe("2026-11-22");
  });
  it("counts down", () => {
    const c = countdown(Date.parse("2026-11-22T10:00:00Z"), Date.parse("2026-11-20T08:30:15Z"));
    expect([c.days, c.hours, c.minutes, c.seconds]).toEqual([2, 1, 29, 45]);
    expect(countdown(1, 5).totalMs).toBe(0);
  });
});

describe("data integrity", () => {
  it("race day is on or after the start and within 3 days", () => {
    for (const r of RACES) {
      const span = (Date.parse(r.raceDate) - Date.parse(r.start)) / 86400000;
      expect(span, r.id).toBeGreaterThanOrEqual(0);
      expect(span, r.id).toBeLessThanOrEqual(3);
    }
  });
  it("race day weekday matches the series pattern (Sat/Sun)", () => {
    for (const r of RACES) expect(["Sat", "Sun"], `${r.id} ${r.raceDate}`).toContain(dayParts(r.raceDate).weekday);
  });
  it("published session times fall inside the weekend in venue time", () => {
    for (const r of RACES.filter((x) => x.sessions)) {
      for (const s of r.sessions!) {
        const d = localDate(Date.parse(s.utc), r.tz);
        expect(d >= r.start && d <= r.raceDate, `${r.id} ${s.name} ${d}`).toBe(true);
      }
    }
  });
  it("has unique ids and valid zones", () => {
    expect(new Set(RACES.map((r) => r.id)).size).toBe(RACES.length);
    for (const r of RACES) expect(() => zonedToUtc(r.start, "00:00", r.tz), r.id).not.toThrow();
  });
  it("has the official 2027 Las Vegas weekend", () => {
    const v = RACES.find((r) => r.id === "f1-2027-22")!;
    expect([v.start, v.raceDate]).toEqual(["2027-11-18", "2027-11-20"]);
  });
});

describe("race phases", () => {
  const vegas = RACES.find((r) => r.id === "f1-2026-21")!;
  const portugal = RACES.find((r) => r.id === "motogp-2026-21")!;
  it("keeps Las Vegas live through the race even though the venue date has rolled over for viewers in India", () => {
    const now = Date.parse("2026-11-22T05:00:00Z"); // 10:30 IST Sun, Vegas race started 04:00Z
    expect(phaseOf(vegas, now)).toBe("live");
    expect(nextRace("f1", now)!.id).toBe("f1-2026-21");
    expect(nextSession(vegas, now)!.session.name).toBe("Race");
    expect(nextSession(vegas, now)!.live).toBe(true);
  });
  it("moves on to Qatar once the Vegas race is over", () => {
    const now = Date.parse("2026-11-22T09:30:00Z");
    expect(phaseOf(vegas, now)).toBe("done");
    expect(nextRace("f1", now)!.id).toBe("f1-2026-22");
  });
  it("keeps MotoGP Portugal upcoming until race day ends", () => {
    expect(phaseOf(portugal, Date.parse("2026-11-22T09:00:00Z"))).toBe("live");
    expect(phaseOf(portugal, Date.parse("2026-11-22T17:00:00Z"))).toBe("done");
    expect(nextRace("motogp", Date.parse("2026-11-22T17:00:00Z"))!.id).toBe("motogp-2026-22");
  });
  it("a weekend without a timetable ends at venue-local midnight after race day", () => {
    const abuDhabi = RACES.find((r) => r.id === "f1-2026-23")!;
    expect(abuDhabi.sessions).toBeUndefined();
    expect(iso(endMs(abuDhabi))).toBe("2026-12-06T20:00:00.000Z"); // Asia/Dubai is UTC+4
    expect(iso(startMs(abuDhabi))).toBe("2026-12-03T20:00:00.000Z");
  });
  it("uses the published Qatar timetable (local UTC+3) and the revised Portimao Sunday", () => {
    const qatar = RACES.find((r) => r.id === "f1-2026-22")!;
    expect(iso(Date.parse(qatar.sessions!.at(-1)!.utc))).toBe("2026-11-29T16:00:00.000Z"); // 19:00 local
    const pt = RACES.find((r) => r.id === "motogp-2026-21")!;
    expect(pt.sessions!.find((x) => x.name === "Warm Up")!.utc).toBe("2026-11-22T09:00:00Z");
  });
  it("flags shared weekends", () => {
    const a = RACES.find((r) => r.id === "f1-2026-20")!;       // Sao Paulo 6-8 Nov
    const b = RACES.find((r) => r.id === "motogp-2026-20")!;   // Qatar 6-8 Nov
    expect(overlaps(a, b)).toBe(true);
  });
});
