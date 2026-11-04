// Date formatting in the society's timezone (events are always shown in Austin time,
// regardless of the visitor's own timezone — matching the Wix site).
const TZ = 'America/Chicago';

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-US', { timeZone: TZ, ...opts });

const shortDay = fmt({ weekday: 'short', month: 'short', day: '2-digit' });
const dateLong = fmt({ month: 'short', day: '2-digit', year: 'numeric' });
const time = fmt({ hour: 'numeric', minute: '2-digit' });
const monthName = fmt({ month: 'long' });
const dayNum = fmt({ day: 'numeric' });
const yearNum = fmt({ year: 'numeric' });
const ymd = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' });

/** "Thu, Nov 05" */
export function formatShortDay(iso: string): string {
  return shortDay.format(new Date(iso));
}

/** "Nov 05, 2026, 6:00 PM – 8:00 PM", or both dates when the event spans days. */
export function formatRange(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const sameDay = ymd.format(s) === ymd.format(e);
  const start = `${dateLong.format(s)}, ${time.format(s)}`;
  const end = sameDay ? time.format(e) : `${dateLong.format(e)}, ${time.format(e)}`;
  return `${start} – ${end}`;
}

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'}`;
}

/** "October 20th, 2026" — the homepage announcement card style. */
export function formatCardDate(iso: string): string {
  const d = new Date(iso);
  return `${monthName.format(d)} ${ordinal(Number(dayNum.format(d)))}, ${yearNum.format(d)}`;
}

/** Compact UTC stamp for calendar links: 20261105T000000Z */
export function toCalendarStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
