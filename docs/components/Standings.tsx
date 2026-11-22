"use client";
import { useState } from "react";
import data from "@/data/standings.json";
import type { Standing } from "@/lib/types";

type Key = "f1d" | "f1c" | "md" | "mc";
const TABS: { key: Key; label: string; series: "f1" | "motogp"; col: string; through: number; rows: Standing[] }[] = [
  { key: "f1d", label: "F1 drivers", series: "f1", col: "Driver", through: data.through.f1Drivers, rows: data.f1.drivers as Standing[] },
  { key: "f1c", label: "F1 constructors", series: "f1", col: "Team", through: data.through.f1Constructors, rows: data.f1.constructors as Standing[] },
  { key: "md", label: "MotoGP riders", series: "motogp", col: "Rider", through: data.through.motoRiders, rows: data.motogp.riders as Standing[] },
  { key: "mc", label: "MotoGP constructors", series: "motogp", col: "Manufacturer", through: data.through.motoConstructors, rows: data.motogp.constructors as Standing[] },
];

export default function Standings({ series }: { series: "all" | "f1" | "motogp" }) {
  const tabs = TABS.filter((t) => series === "all" || t.series === series);
  const [key, setKey] = useState<Key>(tabs[0].key);
  const tab = tabs.find((t) => t.key === key) ?? tabs[0];
  const lead = tab.rows[0]?.points || 1;
  return (
    <section className="sec" aria-labelledby="standings-h">
      <div className="sec-head">
        <h3 id="standings-h">{data.season} standings</h3>
        <p>Through round {tab.through}. Results and standings are entered by hand after each race.</p>
      </div>
      <div className="seg" role="tablist" aria-label="Standings table" style={{ marginBottom: 12, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t.key} role="tab" aria-selected={t.key === tab.key} onClick={() => setKey(t.key)}>{t.label}</button>
        ))}
      </div>
      <table className="table std" data-series={tab.series}>
        <thead><tr><th className="pos">Pos</th><th>{tab.col}</th><th className="team">{tab.rows[0]?.team !== undefined ? "Team" : ""}</th><th className="bar" aria-hidden="true" /><th className="pts" style={{ textAlign: "right" }}>Points</th></tr></thead>
        <tbody>
          {tab.rows.map((r) => (
            <tr key={r.name + r.pos}>
              <td className="pos">{r.pos}</td>
              <td>{r.name}{r.champion && <span className="champ">Champion</span>}</td>
              <td className="team">{r.team ?? ""}</td>
              <td className="bar" aria-hidden="true"><i style={{ width: `${(r.points / lead) * 100}%` }} /></td>
              <td className="pts">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
