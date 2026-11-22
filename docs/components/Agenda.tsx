"use client";
import { useMemo } from "react";
import type { Race, Series } from "@/lib/types";
import standings from "@/data/standings.json";
import { RACES, isWrapUp, phaseOf, sessionsOf, nextSession } from "@/lib/races";
import { daysBetween, dayParts, formatDay, formatInstant, formatRange, localDate, zoneLabel } from "@/lib/time";
import { downloadIcs } from "@/lib/ics";
import TrackMap from "./TrackMap";
import type { ZoneMode } from "./Hero";

export type Tab = "upcoming" | "completed";
const LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const TEAM_OF = new Map<string, string>();
for (const r of [...standings.f1.drivers, ...standings.motogp.riders]) if ("team" in r && r.team) TEAM_OF.set(norm(r.name), r.team);

function stateText(r: Race, now: number, viewerTz: string): React.ReactNode {
  const phase = phaseOf(r, now);
  if (phase === "done") return r.result ? <>Won by <em>{r.result.winner}</em></> : "Completed";
  if (phase === "live") return <em>{isWrapUp(r, now) ? "Race finished" : "Weekend under way"}</em>;
  const diff = daysBetween(localDate(now, r.tz), r.raceDate);
  void viewerTz;
  return <>{diff <= 0 ? "Race day today" : diff === 1 ? "Race tomorrow" : `Race in ${diff} days`}</>;
}

function Detail({ r, now, mode, viewerTz }: { r: Race; now: number; mode: ZoneMode; viewerTz: string }) {
  const ss = sessionsOf(r);
  const ns = nextSession(r, now);
  const tz = mode === "mine" ? viewerTz : r.tz;
  const res = r.result;
  return (
    <div className="detail" id={`detail-${r.id}`}>
      <div>
        <TrackMap trackKey={r.trackKey} label={r.circuit} />
        <dl className="facts">
          <dt>Circuit</dt><dd>{r.circuit}</dd>
          <dt>Place</dt><dd>{r.city}, {r.country}</dd>
          {r.specs && <><dt>Length</dt><dd>{r.specs.lengthKm} km</dd><dt>Turns</dt><dd>{r.specs.turns}</dd>{r.specs.laps && <><dt>Race laps</dt><dd>{r.specs.laps}</dd></>}</>}
        </dl>
      </div>
      <div>
        <h4>Weekend</h4>
        <p>{formatRange(r.start, r.raceDate)}, race day {formatDay(r.raceDate)} (venue dates)</p>
        {r.provisional && <p className="note">Provisional: the date is listed but the venue is still pending homologation.</p>}
        {ss.length > 0 ? (
          <>
            <ul className="timetable" style={{ ["--c" as string]: `var(--${r.series === "f1" ? "f1" : "moto"})` }}>
              {ss.map((s) => {
                const isNow = ns?.session === s && ns.live;
                const isNext = ns?.session === s && !ns.live;
                return (
                  <li key={s.name + s.utc} className={isNow ? "now" : isNext ? "upnext" : now >= s.endsAt ? "past" : undefined}>
                    <span>{formatInstant(s.t, tz)}</span><span>{s.name}</span>
                    <span>{isNow ? <span className="tag">Live</span> : isNext ? <span className="tag">Up next</span> : null}</span>
                  </li>
                );
              })}
            </ul>
            <p className="zone">{mode === "mine" ? `Your time zone (${zoneLabel(ss[0].t, viewerTz)})` : `Venue time (${zoneLabel(ss[0].t, r.tz)})`}</p>
          </>
        ) : (
          phaseOf(r, now) !== "done" && <p className="note">Session times are added closer to race week.</p>
        )}
        <button className="btn" onClick={() => downloadIcs(r, now)}>Add to calendar</button>
      </div>
      <div>
        {res ? (
          <>
            <h4>Result</h4>
            <ol className="podium" style={{ ["--c" as string]: `var(--${r.series === "f1" ? "f1" : "moto"})` }}>
              {res.podium.map((n, i) => (
                <li key={n}><span>{n}<small>{i === 0 ? res.team : TEAM_OF.get(norm(n)) ?? ""}</small></span></li>
              ))}
            </ol>
            {res.sprintWinner && <p className="note">Sprint winner: {res.sprintWinner}</p>}
            {res.note && <p className="note">{res.note}</p>}
          </>
        ) : (
          <>
            <h4>Result</h4>
            <p className="note">{phaseOf(r, now) === "done" ? "Result not entered yet." : "Shown here after the race."}</p>
          </>
        )}
      </div>
    </div>
  );
}

const PREVIEW = 10;

export default function Agenda({ series, tab, now, mode, viewerTz, openId, onToggle, showAll, onShowAll }: {
  series: Series | "all"; tab: Tab; now: number; mode: ZoneMode; viewerTz: string; openId: string | null; onToggle: (id: string) => void;
  showAll: boolean; onShowAll: () => void;
}) {
  const { groups, hidden } = useMemo(() => {
    const list = RACES.filter((r) => (series === "all" || r.series === series) && (phaseOf(r, now) === "done") === (tab === "completed"));
    // Order by race day (what the list shows), F1 before MotoGP on shared days.
    list.sort((a, b) => (a.raceDate === b.raceDate ? (a.series === b.series ? 0 : a.series === "f1" ? -1 : 1) : a.raceDate < b.raceDate ? -1 : 1));
    const ordered = tab === "completed" ? list.slice().reverse() : list;
    const openAt = openId ? ordered.findIndex((r) => r.id === openId) : -1;
    const cut = showAll ? ordered.length : Math.max(PREVIEW, openAt + 1);
    const sorted = ordered.slice(0, cut);
    const out: { key: string; title: string; races: Race[] }[] = [];
    for (const r of sorted) {
      const p = dayParts(r.raceDate);
      const key = `${p.year}-${p.monthIndex}`;
      let g = out[out.length - 1];
      if (!g || g.key !== key) { g = { key, title: `${LONG[p.monthIndex]} ${p.year}`, races: [] }; out.push(g); }
      g.races.push(r);
    }
    return { groups: out, hidden: ordered.length - sorted.length };
  }, [series, tab, now, showAll, openId]);

  if (groups.length === 0) return <div className="rows"><p className="empty">{tab === "upcoming" ? "No more races on the calendar." : "No races completed yet."}</p></div>;

  return (
    <>
      {groups.map((g) => (
        <div key={g.key}>
          <h4 className="month-head">{g.title}</h4>
          <div className="rows">
            {g.races.map((r) => {
              const p = dayParts(r.raceDate);
              const open = openId === r.id;
              return (
                <article key={r.id} id={r.id} className="row" data-series={r.series} data-phase={phaseOf(r, now)} data-selected={open}>
                  <button className="row-head" aria-expanded={open} aria-controls={`detail-${r.id}`} onClick={() => onToggle(r.id)}>
                    <span className="date"><b>{p.day}</b><span>{p.weekday} {p.month}</span></span>
                    <span className="who">
                      <strong>{r.series === "f1" ? "F1" : "MotoGP"} {r.name}{r.sprint && <span className="chip">Sprint</span>}{r.provisional && <span className="chip">Provisional</span>}</strong>
                      <span>{r.circuit}, {r.city}</span>
                    </span>
                    <span className="state">{stateText(r, now, viewerTz)}</span>
                    <i className="chev" aria-hidden="true" />
                  </button>
                  {open && <Detail r={r} now={now} mode={mode} viewerTz={viewerTz} />}
                </article>
              );
            })}
          </div>
        </div>
      ))}
      {hidden > 0 && <button className="more" onClick={onShowAll}>Show all {hidden} more {tab === "upcoming" ? "upcoming" : "completed"} races</button>}
    </>
  );
}
