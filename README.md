# Race Deck — F1 + MotoGP Race Calendar

A free, open-source, **dependency-free** race calendar for **F1** and
**MotoGP**, 2026–2027. A live cockpit-style countdown to the next race, plus
the full remaining schedule for both series. No app to install — it's a
single HTML file.

![platform](https://img.shields.io/badge/platform-any%20browser-black) ![license](https://img.shields.io/badge/license-MIT-blue)

## Use it (0 seconds, no install)

**→ [Open the live page](https://smolvivek.github.io/race-calendar-widget/)**

That's it. It's a static page — works on desktop, phone, tablet, anything
with a browser. Nothing to download, no third-party app, no build step.

Want it on your own machine instead? Download
[`docs/index.html`](docs/index.html) and double-click it — it works fully
offline except for loading its Google Fonts.

## What it looks like

A steering-wheel-style HUD: a central countdown dial (days/hours to the next
session, or a live "RACE WEEK" indicator) flanked by two telemetry panels —
one for F1, one for MotoGP — listing every remaining round, color-coded red
and orange, with sprint-weekend and provisional-calendar flags shown as LED
indicators.

The whole page re-renders every second, so the countdown and clock stay
live with the tab just sitting open — no page reloads needed.

## Updating the calendar data

All race data lives in one place inside [`docs/index.html`](docs/index.html),
in a `DATA` object near the top of the `<script>` block (mirrored in
[`race-calendar.widget/calendar-data.json`](race-calendar.widget/calendar-data.json)
for reference). Each race is a plain object:

```json
{ "round": 9, "name": "Portuguese Grand Prix", "location": "Portimão, Portugal",
  "circuit": "Algarve International Circuit", "start": "2027-06-18",
  "end": "2027-06-20", "sprint": false }
```

If a date shifts (calendars do move — see Notes below), edit the `DATA`
object and refresh the page. No build step, no dependencies.

## Notes on accuracy

- Data reflects the calendars as published by the FIA/F1 and FIM/MotoGP at
  the time this was built (November 2026), cross-checked across multiple
  sources.
- Two 2027 MotoGP rounds — **Argentina** and **Australia (Adelaide)** — are
  marked `"provisional": true` because those venues' homologation wasn't
  finalized as of the official calendar release. They're flagged `PROV` in
  the page.
- Race calendars shift for political, logistical, and commercial reasons
  more often than fans would like. Treat this as a reliable snapshot, not
  a live feed — pull requests with corrected dates are very welcome.

## Why this exists

Built because checking two different apps for F1 and MotoGP race dates was
annoying enough to fix once, properly, for anyone else who wants it too —
without asking anyone to install a third-party desktop-widget engine just
to see a race schedule.

## Legacy: Übersicht desktop widget

An early version of this project shipped as a widget for
[Übersicht](http://tracesof.net/uebersicht/), a free macOS desktop-widget
engine, so it could live pinned to the desktop background. That approach
is kept in [`race-calendar.widget/`](race-calendar.widget/) for anyone who
already uses Übersicht and wants it, but it is **not** required and not the
recommended way to use this project — the page above needs nothing but a
browser.

## Contributing

Found a date that's wrong, or a race that's been moved? Open a PR against
the `DATA` object in `docs/index.html` — that's the only place that should
ever need touching for a calendar update.

## License

MIT — see [LICENSE](LICENSE). Use it, fork it, ship it.
