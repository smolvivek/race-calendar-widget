export type Series = "f1" | "motogp";

export interface Session { name: string; utc: string }

export interface RaceResult {
  winner: string;
  team: string;
  podium: string[];
  sprintWinner?: string | null;
  note?: string;
}

export interface Race {
  id: string;
  series: Series;
  season: number;
  round: number;
  name: string;
  short: string;
  circuit: string;
  trackKey: string | null;
  city: string;
  country: string;
  /** IANA zone of the venue. All date strings below are local to it. */
  tz: string;
  /** First day of the weekend, venue-local, YYYY-MM-DD. */
  start: string;
  /** Race day, venue-local, YYYY-MM-DD. This is the date official calendars quote. */
  raceDate: string;
  sprint: boolean;
  provisional?: boolean;
  specs?: { lengthKm: number; turns: number; laps: number | null };
  /** Published session timetable, as UTC instants. Only present near race week. */
  sessions?: Session[];
  result?: RaceResult;
}

export interface Standing { pos: number; name: string; team?: string; points: number; champion?: boolean }
