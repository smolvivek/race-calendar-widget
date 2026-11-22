"use client";
import type { Race, Series } from "@/lib/types";
import { RACES, isWrapUp, nextRace, nextSession, phaseOf, sessionsOf, startMs } from "@/lib/races";
import { countdown, formatDay, formatInstant, zoneLabel } from "@/lib/time";
import { useNow } from "@/lib/hooks";

export type ZoneMode = "mine" | "venue";

const pad = (n: number) => String(n).padStart(2, "0");
const NAMES: Record<Series, string> = { f1: "Formula 1", motogp: "MotoGP" };

function Digits({ ms }: { ms: number }) {
  const now = useNow(1000);
  if (now === null) return <span className="digits">–</span>;
  const c = countdown(ms, now);
  return (
    <span className="digits" aria-label={`${c.days} days ${c.hours} hours ${c.minutes} minutes`}>
      {c.days > 0 && <>{c.days}<small>d</small></>}
      {pad(c.hours)}<small>h</small>{pad(c.minutes)}<small>m</small>{pad(c.seconds)}<small>s</small>
    </span>
  );
}

export function nextPanelLabel(series: Series, now: number): string | null {
  const r = nextRace(series, now);
  if (!r) return null;
  const phase = phaseOf(r, now);
  const ns = nextSession(r, now);
  if (ns?.live) return `${series === "f1" ? "F1" : "MotoGP"} ${r.short}: ${ns.session.name} live`;
  if (isWrapUp(r, now)) return `${series === "f1" ? "F1" : "MotoGP"} ${r.short}: race finished`;
  const target = ns ? ns.session.t : startMs(r);
  const c = countdown(target, now);
  const text = c.days > 0 ? `${c.days}d ${c.hours}h` : `${pad(c.hours)}:${pad(c.minutes)}`;
  return phase === "live" && !ns ? `${series === "f1" ? "F1" : "MotoGP"} ${r.short}: weekend on` : `${series === "f1" ? "F1" : "MotoGP"} ${r.short} in ${text}`;
}

export default function Hero({ series, now, mode, viewerTz }: { series: Series; now: number; mode: ZoneMode; viewerTz: string }) {
  const race: Race | undefined = nextRace(series, now);
  if (!race) {
    return (
      <section className="next" data-series={series}>
        <div className="series"><b>{NAMES[series]}</b></div>
        <h2>Season complete</h2>
        <p className="where">The next calendar has not been added yet.</p>
      </section>
    );
  }
  const total = RACES.filter((r) => r.series === series && r.season === race.season).length;
  const phase = phaseOf(race, now);
  const ns = nextSession(race, now);
  const sessions = sessionsOf(race);
  const tz = mode === "mine" ? viewerTz : race.tz;
  const anchor = ns ? ns.session.t : startMs(race);

  let lead: React.ReactNode;
  let body: React.ReactNode;
  if (ns?.live) {
    lead = <span className="live" style={{ display: "contents" }}><i className="dot" />Live now</span>;
    body = <span className="digits">{ns.session.name}</span>;
  } else if (ns) {
    lead = <>{ns.session.name} starts in</>;
    body = <Digits ms={ns.session.t} />;
  } else if (isWrapUp(race, now)) {
    lead = <>Chequered flag</>;
    body = <span className="digits">Race finished</span>;
  } else if (phase === "live") {
    lead = <span className="live" style={{ display: "contents" }}><i className="dot" />Race weekend under way</span>;
    body = <span className="digits">Race day {formatDay(race.raceDate).split(" ")[0]}</span>;
  } else {
    lead = <>Weekend starts in</>;
    body = <Digits ms={anchor} />;
  }

  return (
    <section className="next" data-series={series} aria-label={`Next ${NAMES[series]} race`}>
      <div className="series">
        <b>{NAMES[series]}</b>
        <span>Round {race.round} of {total}{race.sprint ? ", sprint weekend" : ""}</span>
      </div>
      <h2>{race.name}</h2>
      <p className="when">Race day {formatDay(race.raceDate)}</p>
      <p className="where">{race.circuit}, {race.city}</p>

      <div className="clock">
        <p className="lead">{lead}</p>
        {body}
        {!ns && phase === "upcoming" && (
          <p className="sub">Venue midnight, {formatDay(race.start)} ({zoneLabel(anchor, race.tz)})</p>
        )}
      </div>

      {sessions.length > 0 ? (
        <>
          <ul className="timetable">
            {sessions.map((s) => {
              const isNow = ns?.session === s && ns.live;
              const isNext = ns?.session === s && !ns.live;
              const past = now >= s.endsAt;
              return (
                <li key={s.name + s.utc} className={isNow ? "now" : isNext ? "upnext" : past ? "past" : undefined}>
                  <span>{formatInstant(s.t, tz)}</span>
                  <span>{s.name}</span>
                  <span>{isNow ? <span className="tag">Live</span> : isNext ? <span className="tag">Up next</span> : null}</span>
                </li>
              );
            })}
          </ul>
          <p className="zone">
            {mode === "mine" ? `Times in your time zone (${zoneLabel(sessions[0].t, viewerTz)})` : `Times at the venue (${zoneLabel(sessions[0].t, race.tz)})`}
          </p>
        </>
      ) : (
        <p className="note">Session times are added closer to race week. Dates here are venue dates.</p>
      )}
    </section>
  );
}
