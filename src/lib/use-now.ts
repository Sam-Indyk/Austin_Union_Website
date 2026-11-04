'use client';

import { useSyncExternalStore } from 'react';

/**
 * The current time in the browser, refreshed every `stepMs`. Returns null during
 * server rendering and hydration, so markup never mismatches; the real clock
 * takes over immediately after.
 */
export function useNow(stepMs = 60_000): number | null {
  const bucket = useSyncExternalStore(
    (onChange) => {
      const t = setInterval(onChange, Math.min(stepMs, 15_000));
      return () => clearInterval(t);
    },
    () => Math.floor(Date.now() / stepMs),
    () => null,
  );
  return bucket === null ? null : bucket * stepMs;
}
