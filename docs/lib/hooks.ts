"use client";
import { useEffect, useState } from "react";

/** Current time, floored to `step` ms. Null until mounted so server and client markup agree. */
export function useNow(step = 1000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const q = Math.floor(Date.now() / step) * step;
      setNow((prev) => (prev === q ? prev : q));
    };
    tick();
    const id = setInterval(tick, Math.min(step, 1000));
    return () => clearInterval(id);
  }, [step]);
  return now;
}

export function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = window.localStorage.getItem(key);
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
  } catch { return fallback; }
}
export function writeStored(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}
