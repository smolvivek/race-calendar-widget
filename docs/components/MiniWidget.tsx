"use client";
import { useEffect, useState } from "react";
import type { Series } from "@/lib/types";
import { isWrapUp, nextRace, nextSession, phaseOf, startMs } from "@/lib/races";
import { countdown, formatDay, formatInstant, viewerZone, zoneLabel } from "@/lib/time";
import { readStored, useNow } from "@/lib/hooks";

const pad = (n: number) => String(n).padStart(2, "0");
const NAME: Record<Series, string> = { f1: "Formula 1", motogp: "MotoGP" };

function Block({ series, now, tz }: { series: Series; now: number; tz: string }) {
  const race = nextRace(series, now);
  if (!race) return <section className="mini-block" data-series={series}><div className="mini-top"><b>{NAME[series]}</b></div><h2>Season complete</h2></section>;
  const ns = nextSession(race, now);
  const phase = phaseOf(race, now);
  const target = ns && !ns.live ? ns.session.t : !ns && phase === "upcoming" ? startMs(race) : null;
  const c = target ? countdown(target, now) : null;
  const lead = isWrapUp(race, now) ? "Chequered flag" : ns?.live ? `Live now: ${ns.session.name}` : ns ? `${ns.session.name} in` : phase === "live" ? "Race weekend under way" : "Weekend starts in";
  return (
    <section className="mini-block" data-series={series}>
      <div className="mini-top"><b>{NAME[series]}</b><span>Round {race.round}</span></div>
      <h2>{race.short}</h2>
      <p className="mini-lead">{ns?.live && <i className="dot live-dot" />}{lead}</p>
      {isWrapUp(race, now) && <p className="mini-digits">Race finished</p>}
      {c && (
        <p className="mini-digits">
          {c.days > 0 && <>{c.days}<small>d</small></>}{pad(c.hours)}<small>h</small>{pad(c.minutes)}<small>m</small>{pad(c.seconds)}<small>s</small>
        </p>
      )}
      <p className="mini-sub">
        {ns ? `${formatInstant(ns.session.t, tz)} (${zoneLabel(ns.session.t, tz)})` : `Race day ${formatDay(race.raceDate)}`}
      </p>
    </section>
  );
}

/** Compact, always-readable view for a small window or a pinned corner of the screen. */
export default function MiniWidget({ series: forced, syncTitle = true }: { series?: Series | "all"; syncTitle?: boolean }) {
  const now = useNow(1000);
  const [pref, setPref] = useState<Series | "all">("all");
  const [tz, setTz] = useState("UTC");
  useEffect(() => {
    setPref(forced ?? readStored("raceDeck.series", ["all", "f1", "motogp"] as const, "all"));
    setTz(viewerZone());
  }, [forced]);
  useEffect(() => {
    if (now === null || !syncTitle) return;
    const s = pref === "all" ? (["f1", "motogp"] as Series[]) : [pref];
    const r = nextRace(s[0], now);
    document.title = r ? `${r.short} · Race Deck` : "Race Deck";
  }, [now, pref, syncTitle]);
  if (now === null) return <div className="mini" aria-busy="true" />;
  const list: Series[] = pref === "all" ? ["f1", "motogp"] : [pref];
  return (
    <div className="mini">
      {list.map((s) => <Block key={s} series={s} now={now} tz={tz} />)}
      <a className="mini-open" href="/" target="_blank" rel="noopener">Open full calendar</a>
    </div>
  );
}
