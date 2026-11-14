# Race Calendar Widget

A free, open-source macOS desktop widget showing the **F1** and **MotoGP**
race calendars for 2026–2027 — a live countdown to the next race, and the
full remaining schedule for both series, right on your desktop.

![platform](https://img.shields.io/badge/platform-macOS-black) ![license](https://img.shields.io/badge/license-MIT-blue)

## What it looks like

- **Next up**: a countdown (days / hours) to the next race, with the circuit,
  location, and whether it's a sprint weekend.
- **Full schedule**: every remaining F1 and MotoGP round through the end of
  the 2027 season, color-coded by series (red for F1, orange for MotoGP),
  with sprint and provisional-calendar flags.

The widget refreshes once a minute, so the countdown stays accurate without
hammering your machine.

## Install (2 minutes)

1. **Install [Übersicht](http://tracesof.net/uebersicht/)** — a free, tiny
   macOS app that renders widgets on your desktop background. (This is the
   same engine behind most of the "desktop widget" setups you've seen on
   r/unixporn or macOS customization blogs.)
2. Open Übersicht once so it creates `~/Library/Application Support/Übersicht/widgets`.
3. Copy the `race-calendar.widget` folder from this repo into that
   `widgets` folder, e.g.:
   ```
   cp -R race-calendar.widget ~/Library/Application\ Support/Übersicht/widgets/
   ```
4. In the menu bar, click the Übersicht icon → **Refresh**. The widget
   appears in the top-left of your screen.
5. To reposition it, hold the key Übersicht uses for repositioning
   (shown in its menu bar menu) and drag it anywhere you like.

That's it — no build step, no Xcode, no Apple Developer account. It's a
folder of HTML/JS that Übersicht renders for you.

## Updating the calendar data

All race data lives in one file: `race-calendar.widget/calendar-data.json`.
Each race is a plain object:

```json
{ "round": 9, "name": "Portuguese Grand Prix", "location": "Portimão, Portugal",
  "circuit": "Algarve International Circuit", "start": "2027-06-18",
  "end": "2027-06-20", "sprint": false }
```

If a date shifts (calendars do move — see Notes below), edit this file and
hit Refresh in Übersicht. No code changes needed.

## Notes on accuracy

- Data reflects the calendars as published by the FIA/F1 and FIM/MotoGP at
  the time this was built (November 2026), cross-checked across multiple
  sources.
- Two 2027 MotoGP rounds — **Argentina** and **Australia (Adelaide)** — are
  marked `"provisional": true` because those venues' homologation wasn't
  finalized as of the official calendar release. They're flagged `PROV` in
  the widget.
- Race calendars shift for political, logistical, and commercial reasons
  more often than fans would like. Treat this as a reliable snapshot, not
  a live feed — pull requests with corrected dates are very welcome.

## Why this exists

Built because checking two different apps for F1 and MotoGP race dates was
annoying enough to fix once, properly, for anyone else who wants it too.

## Contributing

Found a date that's wrong, or a race that's been moved? Open a PR against
`calendar-data.json` — that's the only file that should ever need touching
for a calendar update.

## License

MIT — see [LICENSE](LICENSE). Use it, fork it, ship it.
