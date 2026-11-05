// Converting between Austin wall-clock times (what officers type) and instants.
const TZ = 'America/Chicago';

const parts = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function wallClock(ms: number) {
  const p = Object.fromEntries(parts.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute };
}

/** "2026-11-05" + "18:00" (Austin time) → ISO instant, DST-aware. */
export function austinToISO(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const target = Date.UTC(y, m - 1, d, h, min);
  // Start from the instant whose UTC reading equals the wall time, then correct
  // by the zone offset observed at that instant (twice covers DST edges).
  let guess = target;
  for (let i = 0; i < 2; i++) {
    const w = wallClock(guess);
    guess += target - Date.UTC(w.y, w.m - 1, w.d, w.h, w.min);
  }
  return new Date(guess).toISOString();
}

/** ISO instant → { date: "2026-11-05", time: "18:00" } in Austin time (for form fields). */
export function isoToAustin(iso: string): { date: string; time: string } {
  const w = wallClock(Date.parse(iso));
  const pad = (n: number) => String(n).padStart(2, '0');
  return { date: `${w.y}-${pad(w.m)}-${pad(w.d)}`, time: `${pad(w.h)}:${pad(w.min)}` };
}

/** The current time in ms. (Server pages call this after `connection()`, so it runs per request.) */
export function nowMs(): number {
  return Date.now();
}
