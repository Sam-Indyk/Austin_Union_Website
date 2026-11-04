import type { EventItem } from './content/types';
import { toCalendarStamp } from './dates';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.austinunion.org';

const strip = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

function location(e: EventItem) {
  return [e.locationName, e.address].filter(Boolean).join(', ');
}

export function googleCalendarUrl(e: EventItem): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${toCalendarStamp(e.startsAt)}/${toCalendarStamp(e.endsAt)}`,
    details: `${e.summary}\n\n${SITE}/events/${e.slug}`,
    location: location(e),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

const icsEscape = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** Fold lines longer than 75 octets, per RFC 5545. */
const fold = (line: string) => line.match(/.{1,73}/g)!.join('\r\n ');

export function icsFor(e: EventItem): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Austin Union//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.id}@austinunion.org`,
    `DTSTAMP:${toCalendarStamp(e.startsAt)}`,
    `DTSTART:${toCalendarStamp(e.startsAt)}`,
    `DTEND:${toCalendarStamp(e.endsAt)}`,
    `SUMMARY:${icsEscape(e.title)}`,
    `DESCRIPTION:${icsEscape(`${e.summary}\n\n${strip(e.description)}`.trim())}`,
    `LOCATION:${icsEscape(location(e))}`,
    `URL:${SITE}/events/${e.slug}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}
