"use client";
import { useCallback, useEffect, useState } from "react";
import type { Race, Series } from "@/lib/types";
import { RACES, nextRace, phaseOf } from "@/lib/races";
import { viewerZone } from "@/lib/time";
import { readStored, useNow, writeStored } from "@/lib/hooks";
import Hero, { nextPanelLabel, type ZoneMode } from "./Hero";
import SeasonStrip from "./SeasonStrip";
import Agenda, { type Tab } from "./Agenda";
import Standings from "./Standings";
import AppActions from "./AppActions";
import standings from "@/data/standings.json";

type Filter = Series | "all";
const FILTERS = ["all", "f1", "motogp"] as const;
const MODES = ["mine", "venue"] as const;

export default function RaceDeck() {
  const minute = useNow(60_000);
  const second = useNow(1000);
  const [filter, setFilter] = useState<Filter>("all");
  const [mode, setMode] = useState<ZoneMode>("mine");
  const [tab, setTab] = useState<Tab>("upcoming");
  const [openId, setOpenId] = useState<string | null>(null);
  const [viewerTz, setViewerTz] = useState("UTC");
  const [pendingScroll, setPendingScroll] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setFilter(readStored("raceDeck.series", FILTERS, "all"));
    setMode(readStored("raceDeck.zone", MODES, "mine"));
    setViewerTz(viewerZone());
  }, []);

  const pickFilter = (f: Filter) => { setFilter(f); setShowAll(false); writeStored("raceDeck.series", f); };
  const pickTab = (t: Tab) => { setTab(t); setShowAll(false); };
  const pickMode = (m: ZoneMode) => { setMode(m); writeStored("raceDeck.zone", m); };

  // Tab title carries the soonest countdown so a pinned tab stays useful.
  useEffect(() => {
    if (second === null) return;
    const series: Series[] = filter === "all" ? ["f1", "motogp"] : [filter];
    const labels = series.map((s) => nextPanelLabel(s, second)).filter(Boolean);
    document.title = labels.length ? `${labels[0]} · Race Deck` : "Race Deck";
  }, [second, filter]);

  const select = useCallback((r: Race) => {
    setOpenId((cur) => (cur === r.id ? null : r.id));
    setTab(phaseOf(r, minute ?? Date.now()) === "done" ? "completed" : "upcoming");
    setPendingScroll(r.id);
  }, [minute]);

  useEffect(() => {
    if (!pendingScroll) return;
    const el = document.getElementById(pendingScroll);
    if (el) el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    setPendingScroll(null);
  }, [pendingScroll, openId, tab]);

  const toggleRow = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  if (minute === null || second === null) return <main className="wrap skeleton" aria-busy="true"><div className="top"><div className="mark">Race <span>Deck</span></div></div></main>;

  const visible: Series[] = filter === "all" ? ["f1", "motogp"] : [filter];
  const upcomingFirst = visible.map((s) => nextRace(s, minute)).filter(Boolean) as Race[];
  const stripSeason = (upcomingFirst.sort((a, b) => a.season - b.season)[0]?.season) ?? new Date(minute).getUTCFullYear();
  const upcomingCount = RACES.filter((r) => (filter === "all" || r.series === filter) && phaseOf(r, minute) !== "done").length;
  const doneCount = RACES.filter((r) => (filter === "all" || r.series === filter) && phaseOf(r, minute) === "done").length;

  return (
    <main className="wrap">
      <header className="top">
        <h1 className="mark">Race <span>Deck</span></h1>
        <div className="controls">
          <div className="seg" role="group" aria-label="Series">
            {FILTERS.map((f) => (
              <button key={f} aria-pressed={filter === f} onClick={() => pickFilter(f)}>{f === "all" ? "Both" : f === "f1" ? "F1" : "MotoGP"}</button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Session times">
            <button aria-pressed={mode === "mine"} onClick={() => pickMode("mine")}>My time</button>
            <button aria-pressed={mode === "venue"} onClick={() => pickMode("venue")}>Venue time</button>
          </div>
          <AppActions />
        </div>
      </header>

      <div className={`hero ${visible.length === 2 ? "two" : ""}`}>
        {visible.map((s) => <Hero key={s} series={s} now={second} mode={mode} viewerTz={viewerTz} />)}
      </div>

      <section className="sec" aria-labelledby="season-h">
        <div className="sec-head">
          <h3 id="season-h">{stripSeason} season</h3>
          <p>Each bar is a race weekend, placed by its venue dates. Shaded columns are weekends when both series race.</p>
        </div>
        <SeasonStrip series={filter} season={stripSeason} now={minute} viewerTz={viewerTz} selectedId={openId} onSelect={select} />
      </section>

      <section className="sec" aria-labelledby="cal-h">
        <div className="sec-head">
          <h3 id="cal-h">Calendar</h3>
          <p>Dates are race day at the venue, the way official calendars quote them.</p>
        </div>
        <div className="agenda-bar">
          <div className="seg" role="tablist" aria-label="Calendar view">
            <button role="tab" aria-selected={tab === "upcoming"} onClick={() => pickTab("upcoming")}>Upcoming ({upcomingCount})</button>
            <button role="tab" aria-selected={tab === "completed"} onClick={() => pickTab("completed")}>Completed ({doneCount})</button>
          </div>
        </div>
        <Agenda series={filter} tab={tab} now={minute} mode={mode} viewerTz={viewerTz} openId={openId} onToggle={toggleRow} showAll={showAll} onShowAll={() => setShowAll(true)} />
      </section>

      <Standings key={filter} series={filter} />

      <footer className="foot">
        <span>Calendar checked against formula1.com and motogp.com on 22 Nov 2026. Standings updated {standings.updated}.</span>
        <a href="https://github.com/smolvivek/race-calendar-widget">Source on GitHub</a>
      </footer>
    </main>
  );
}
