// Regenerates race-calendar.widget/calendar-data.json from data/races.json,
// so the desktop widget and the website can never disagree about a date.
import { readFileSync, writeFileSync } from "node:fs";

const races = JSON.parse(readFileSync(new URL("../data/races.json", import.meta.url), "utf8"));
const standings = JSON.parse(readFileSync(new URL("../data/standings.json", import.meta.url), "utf8"));

const out = {
  meta: {
    lastUpdated: standings.updated,
    sources: ["https://www.formula1.com", "https://www.motogp.com"],
    notes: "Generated from data/races.json by scripts/build-widget-data.mjs. Dates are venue-local; 'end' is race day.",
  },
  f1: {},
  motogp: {},
};
for (const r of races) {
  const bucket = (out[r.series][r.season] ??= []);
  const row = { round: r.round, name: r.name, location: `${r.city}, ${r.country}`, circuit: r.circuit, start: r.start, end: r.raceDate };
  if (r.series === "f1") row.sprint = r.sprint;
  else row.provisional = !!r.provisional;
  bucket.push(row);
}
writeFileSync(new URL("../../race-calendar.widget/calendar-data.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log("wrote ../race-calendar.widget/calendar-data.json");
