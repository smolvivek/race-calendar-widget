import type { Race } from "./types";
import { addDays, formatDay } from "./time";
import { sessionsOf } from "./races";

const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const day = (d: string) => d.replace(/-/g, "");

/** Calendar file for one race weekend: timed events when a timetable is published, one all-day block otherwise. */
export function buildIcs(r: Race, nowMs: number): string {
  const series = r.series === "f1" ? "F1" : "MotoGP";
  const where = `${r.circuit}, ${r.city}, ${r.country}`;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Race Deck//EN", "CALSCALE:GREGORIAN"];
  const ss = sessionsOf(r);
  if (ss.length) {
    for (const s of ss) {
      lines.push(
        "BEGIN:VEVENT", `UID:${r.id}-${s.name.replace(/\W+/g, "")}@race-deck`, `DTSTAMP:${stamp(nowMs)}`,
        `DTSTART:${stamp(s.t)}`, `DTEND:${stamp(s.endsAt)}`,
        `SUMMARY:${esc(`${series} ${r.short}: ${s.name}`)}`, `LOCATION:${esc(where)}`, "END:VEVENT",
      );
    }
  } else {
    lines.push(
      "BEGIN:VEVENT", `UID:${r.id}@race-deck`, `DTSTAMP:${stamp(nowMs)}`,
      `DTSTART;VALUE=DATE:${day(r.start)}`, `DTEND;VALUE=DATE:${day(addDays(r.raceDate, 1))}`,
      `SUMMARY:${esc(`${series} ${r.name}`)}`, `LOCATION:${esc(where)}`,
      `DESCRIPTION:${esc(`Race day ${formatDay(r.raceDate)} (venue time). Session times are added closer to race week.`)}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(r: Race, nowMs: number) {
  const blob = new Blob([buildIcs(r, nowMs)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${r.series}-${r.season}-r${String(r.round).padStart(2, "0")}-${r.short.toLowerCase().replace(/\W+/g, "-")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
