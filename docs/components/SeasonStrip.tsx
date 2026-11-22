"use client";
import { useEffect, useRef, useState } from "react";
import type { Race, Series } from "@/lib/types";
import { RACES, nextRace, overlaps, phaseOf } from "@/lib/races";
import { addDays, formatDay, localDate } from "@/lib/time";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const doy = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return (Date.UTC(y, m - 1, day) - Date.UTC(y, 0, 1)) / 86400000;
};
const daysIn = (y: number) => (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 366 : 365);

export default function SeasonStrip({ series, season, now, viewerTz, selectedId, onSelect }: {
  series: Series | "all"; season: number; now: number; viewerTz: string; selectedId: string | null; onSelect: (r: Race) => void;
}) {
  const [hover, setHover] = useState<Race | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const total = daysIn(season);
  const lanes: Series[] = series === "all" ? ["f1", "motogp"] : [series];
  const byLane = (s: Series) => RACES.filter((r) => r.series === s && r.season === season);
  const nextIds = new Set(lanes.map((s) => nextRace(s, now)?.id));

  const clashes: { left: number; width: number; a: Race; b: Race }[] = [];
  if (series === "all") {
    for (const a of byLane("f1")) for (const b of byLane("motogp")) {
      if (overlaps(a, b)) {
        const s = a.start < b.start ? a.start : b.start;
        const e = a.raceDate > b.raceDate ? a.raceDate : b.raceDate;
        clashes.push({ left: (doy(s) / total) * 100, width: ((doy(addDays(e, 1)) - doy(s)) / total) * 100, a, b });
      }
    }
  }

  const today = localDate(now, viewerTz);
  const showToday = Number(today.slice(0, 4)) === season;
  // On narrow screens the plot scrolls sideways; start with today in view.
  useEffect(() => {
    const el = scroller.current;
    if (!el || !showToday || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = (doy(today) / total) * el.scrollWidth - el.clientWidth * 0.6;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season]);

  const shown = hover ?? RACES.find((r) => r.id === selectedId && r.season === season) ?? null;

  return (
    <>
      <div className="strip">
        <div className="labels" aria-hidden="true">
          {lanes.length === 1 ? <div className={`l-${lanes[0]}`} style={{ height: 128 }}>{lanes[0] === "f1" ? "F1" : "MotoGP"}</div>
            : lanes.map((s) => <div key={s} className={`l-${s}`}>{s === "f1" ? "F1" : "MotoGP"}</div>)}
        </div>
        <div className="scroll" ref={scroller}>
          <div className="plot" role="group" aria-label={`${season} season on one timeline`}>
            {MONTHS.map((m, i) => (
              <div key={m} className="month" style={{ left: `${(doy(`${season}-${String(i + 1).padStart(2, "0")}-01`) / total) * 100}%` }}>
                <span>{m}</span>
              </div>
            ))}
            {clashes.map((c) => <div key={c.a.id + c.b.id} className="clash" style={{ left: `${c.left}%`, width: `${c.width}%` }} />)}
            {lanes.map((s, li) => (
              <div key={s} className={`lane ${lanes.length === 1 ? "solo" : li === 0 ? "a" : "b"}`}>
                {byLane(s).map((r) => {
                  const left = (doy(r.start) / total) * 100;
                  const width = ((doy(r.raceDate) - doy(r.start) + 1) / total) * 100;
                  return (
                    <span key={r.id}>
                      <button
                        className="bar" data-series={r.series} data-phase={phaseOf(r, now)} data-next={nextIds.has(r.id)}
                        data-selected={selectedId === r.id} data-provisional={r.provisional ? "true" : undefined}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        aria-label={`${r.name}, race day ${formatDay(r.raceDate)}`}
                        onClick={() => onSelect(r)} onMouseEnter={() => setHover(r)} onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(r)} onBlur={() => setHover(null)}
                      />
                      <span className="num" style={{ left: `${left + width / 2}%` }}>{r.round}</span>
                    </span>
                  );
                })}
              </div>
            ))}
            {showToday && <div className="today" style={{ left: `${(doy(today) / total) * 100}%` }}><span>Today</span></div>}
          </div>
        </div>
      </div>
      <div className="strip-cap" aria-live="polite">
        <span>
          {shown ? <><strong>{shown.name}</strong>, race day {formatDay(shown.raceDate)}, {shown.city}</> : "Hover or tap a weekend to see it. Tap again to open it in the list."}
        </span>
        {series === "all" && <span className="key"><i />Both series race the same weekend</span>}
      </div>
    </>
  );
}
