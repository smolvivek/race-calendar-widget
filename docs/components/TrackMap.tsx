import tracks from "@/data/tracks.json";

type Track = { d: string; vbW: number; vbH: number };

export default function TrackMap({ trackKey, label }: { trackKey: string | null; label: string }) {
  const t = trackKey ? (tracks as Record<string, Track>)[trackKey] : undefined;
  if (!t) return null;
  return (
    <svg className="track" viewBox={`0 0 ${t.vbW} ${t.vbH}`} role="img" aria-label={`Layout of ${label}`} preserveAspectRatio="xMinYMid meet">
      <path d={t.d} pathLength={1} />
    </svg>
  );
}
