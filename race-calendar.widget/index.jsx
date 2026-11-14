import { css } from 'uebersicht';

// Race Calendar — F1 + MotoGP, 2026-2027
// Reads calendar-data.json (bundled alongside this file) and renders
// a "next race" countdown plus the full remaining schedule for both series.

export const command = 'cat calendar-data.json';
export const refreshFrequency = 60000; // re-check every minute so the countdown stays live

export const className = `
  left: 40px;
  top: 40px;
  width: 460px;
  font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
  color: #eef0f3;
  -webkit-font-smoothing: antialiased;
`;

const COLORS = {
  f1: '#e10600',
  moto: '#ff8a00',
  bg: 'rgba(16, 17, 22, 0.86)',
  bgSoft: 'rgba(255, 255, 255, 0.045)',
  border: 'rgba(255, 255, 255, 0.08)',
  dim: 'rgba(238, 240, 243, 0.52)',
  dimmer: 'rgba(238, 240, 243, 0.32)',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0);
};

const fmtDate = (iso) => {
  const d = parseDate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
};

const fmtRange = (startIso, endIso) => {
  const s = parseDate(startIso);
  const e = parseDate(endIso);
  if (s.getMonth() === e.getMonth()) {
    return `${MONTHS[s.getMonth()]} ${s.getDate()}–${e.getDate()}`;
  }
  return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()}`;
};

const buildUpcoming = (data) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const flatten = (seriesKey, seriesData) =>
    Object.keys(seriesData).reduce((acc, year) => {
      seriesData[year].forEach((race) => {
        acc.push({ ...race, series: seriesKey, year: Number(year) });
      });
      return acc;
    }, []);

  const all = [...flatten('f1', data.f1), ...flatten('moto', data.motogp)];

  const upcoming = all
    .filter((race) => parseDate(race.end) >= now)
    .sort((a, b) => parseDate(a.start) - parseDate(b.start));

  return { upcoming, now };
};

const countdownParts = (race, now) => {
  const start = parseDate(race.start);
  const end = parseDate(race.end);
  const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);

  if (now >= start && now <= endOfDay) {
    return { live: true };
  }

  const diffMs = start - now;
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  return { live: false, days, hours };
};

// Only trims the generic English "... Grand Prix" suffix so rows fit on one
// line. Non-English official names (Gran Premio, Grande Prêmio, Grosser
// Preis, Grand Prix de ...) are left exactly as published rather than
// risking a half-translated truncation.
const shortName = (name) => name.replace(/ Grand Prix$/, '');

const SeriesBadge = ({ series }) => {
  const isF1 = series === 'f1';
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        padding: '2px 7px',
        borderRadius: 4,
        color: '#0c0c0e',
        background: isF1 ? COLORS.f1 : COLORS.moto,
      }}
    >
      {isF1 ? 'F1' : 'MOTOGP'}
    </span>
  );
};

const NextRaceCard = ({ race, now }) => {
  const cd = countdownParts(race, now);
  const accent = race.series === 'f1' ? COLORS.f1 : COLORS.moto;

  return (
    <div
      style={{
        padding: '18px 20px',
        borderBottom: `1px solid ${COLORS.border}`,
        background: `linear-gradient(135deg, ${accent}22, transparent 60%)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: COLORS.dim }}>
          NEXT UP
        </span>
        <SeriesBadge series={race.series} />
      </div>

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        {cd.live ? (
          <span style={{ fontSize: 28, fontWeight: 800, color: accent, letterSpacing: '0.02em' }}>
            RACE WEEK
          </span>
        ) : (
          <>
            <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{cd.days}</span>
            <span style={{ fontSize: 13, color: COLORS.dim, marginRight: 6 }}>d</span>
            <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{cd.hours}</span>
            <span style={{ fontSize: 13, color: COLORS.dim }}>h</span>
          </>
        )}
      </div>

      <div style={{ marginTop: 8, fontSize: 16, fontWeight: 600 }}>{race.name}</div>
      <div style={{ marginTop: 2, fontSize: 12.5, color: COLORS.dim }}>
        {race.circuit} &middot; {race.location}
      </div>
      <div style={{ marginTop: 6, fontSize: 11.5, color: COLORS.dimmer, letterSpacing: '0.02em' }}>
        {fmtRange(race.start, race.end)}, {race.year}
        {race.sprint ? '  •  SPRINT WEEKEND' : ''}
        {race.provisional ? '  •  PROVISIONAL' : ''}
      </div>
    </div>
  );
};

const RaceRow = ({ race, isNext }) => {
  const accent = race.series === 'f1' ? COLORS.f1 : COLORS.moto;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 20px',
        background: isNext ? 'rgba(255,255,255,0.04)' : 'transparent',
        borderLeft: isNext ? `2px solid ${accent}` : '2px solid transparent',
      }}
    >
      <span
        style={{
          width: 54,
          flexShrink: 0,
          fontSize: 11,
          fontWeight: 600,
          color: COLORS.dim,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {fmtDate(race.start)}
      </span>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 8,
          flexShrink: 0,
          background: accent,
        }}
      />
      <span style={{ fontSize: 12.5, flex: 1, color: '#eef0f3' }}>{shortName(race.name)}</span>
      <span style={{ fontSize: 10, color: COLORS.dimmer, flexShrink: 0 }}>{race.year}</span>
      {(race.sprint || race.provisional) && (
        <span
          style={{
            fontSize: 8.5,
            fontWeight: 700,
            color: COLORS.dimmer,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 3,
            padding: '1px 4px',
            flexShrink: 0,
          }}
        >
          {race.sprint ? 'SPR' : 'PROV'}
        </span>
      )}
    </div>
  );
};

export const render = ({ output, error }) => {
  const wrapper = (children) => (
    <div
      style={{
        background: COLORS.bg,
        borderRadius: 14,
        border: `1px solid ${COLORS.border}`,
        boxShadow: '0 20px 48px rgba(0,0,0,0.45)',
        overflow: 'hidden',
        backdropFilter: 'blur(18px)',
      }}
    >
      {children}
    </div>
  );

  if (error) {
    return wrapper(
      <div style={{ padding: 20, fontSize: 12, color: COLORS.dim }}>
        Couldn't read calendar-data.json ({String(error)})
      </div>
    );
  }

  if (!output) {
    return wrapper(<div style={{ padding: 20, fontSize: 12, color: COLORS.dim }}>Loading race calendar…</div>);
  }

  let data;
  try {
    data = JSON.parse(output);
  } catch (e) {
    return wrapper(
      <div style={{ padding: 20, fontSize: 12, color: COLORS.dim }}>
        calendar-data.json isn't valid JSON.
      </div>
    );
  }

  const { upcoming, now } = buildUpcoming(data);

  if (upcoming.length === 0) {
    return wrapper(
      <div style={{ padding: 20, fontSize: 12, color: COLORS.dim }}>
        No upcoming races in the data file — time to add the next season.
      </div>
    );
  }

  const [next, ...rest] = upcoming;

  return wrapper(
    <div>
      <NextRaceCard race={next} now={now} />

      <div
        style={{
          maxHeight: 360,
          overflowY: 'auto',
          padding: '10px 0',
        }}
      >
        <div style={{ padding: '2px 20px 6px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: COLORS.dimmer }}>
          FULL SCHEDULE
        </div>
        {rest.map((race) => (
          <RaceRow key={`${race.series}-${race.year}-${race.round}`} race={race} isNext={false} />
        ))}
      </div>

      <div
        style={{
          padding: '8px 20px',
          borderTop: `1px solid ${COLORS.border}`,
          fontSize: 9.5,
          color: COLORS.dimmer,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>F1 + MotoGP • 2026–27</span>
        <span>updated {data.meta && data.meta.lastUpdated}</span>
      </div>
    </div>
  );
};
