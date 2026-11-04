// Read access to site content.
//
// Every public page reads through these functions. They are cached with
// `use cache` and tagged, so admin edits can invalidate exactly what changed
// (updateTag('events'), updateTag('team'), …). Time-dependent results
// (upcoming vs. past) use a short lifetime so an event moves to "Past Events"
// within about a minute of ending, with no manual edit.
//
// Today this reads the seed module; the Supabase-backed implementation will
// replace the bodies of these functions without changing their signatures.
import { cacheLife, cacheTag } from 'next/cache';
import * as seed from './seed';
import type { EventItem } from './types';

export async function getSettings() {
  'use cache';
  cacheLife('hours');
  cacheTag('settings');
  return seed.settings;
}

export async function getHome() {
  'use cache';
  cacheLife('hours');
  cacheTag('home');
  return seed.home;
}

export async function getMission() {
  'use cache';
  cacheLife('hours');
  cacheTag('mission');
  return seed.mission;
}

export async function getTeam() {
  'use cache';
  cacheLife('hours');
  cacheTag('team');
  return seed.team;
}

export async function getDonate() {
  'use cache';
  cacheLife('hours');
  cacheTag('donate');
  return seed.donate;
}

export async function getContact() {
  'use cache';
  cacheLife('hours');
  cacheTag('contact');
  return seed.contact;
}

export async function getCollage() {
  'use cache';
  cacheLife('hours');
  cacheTag('collage');
  return seed.collage;
}

function isVisible(e: EventItem, now: number) {
  if (e.status === 'draft') return false;
  if (e.publishAt && Date.parse(e.publishAt) > now) return false;
  return true;
}

export interface EventTimeline {
  /** Soonest first. Includes events that are happening right now. */
  upcoming: EventItem[];
  /** Most recent first. */
  past: EventItem[];
  /** Upcoming events flagged for the homepage card, soonest first. */
  featured: EventItem[];
  /** When this snapshot was computed (ms). */
  asOf: number;
}

export async function getEventTimeline(): Promise<EventTimeline> {
  'use cache';
  cacheLife('minutes');
  cacheTag('events');
  const now = Date.now();
  const visible = seed.events.filter((e) => isVisible(e, now));
  const upcoming = visible
    .filter((e) => Date.parse(e.endsAt) > now && e.status !== 'cancelled')
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const past = visible
    .filter((e) => Date.parse(e.endsAt) <= now && e.status !== 'cancelled')
    .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));
  return { upcoming, past, featured: upcoming.filter((e) => e.featureOnHome), asOf: now };
}

export async function getEventBySlug(slug: string) {
  'use cache';
  cacheLife('minutes');
  cacheTag('events', `event:${slug}`);
  const now = Date.now();
  const event = seed.events.find((e) => e.slug === slug && isVisible(e, now));
  if (!event) return null;
  const isPast = Date.parse(event.endsAt) <= now;
  const acceptingRsvps =
    !isPast && event.status === 'published' && event.rsvp.mode === 'native' && now < Date.parse(event.rsvp.closesAt ?? event.startsAt);
  return { event, isPast, acceptingRsvps, asOf: now };
}

export async function getAllEventSlugs() {
  'use cache';
  cacheLife('minutes');
  cacheTag('events');
  return seed.events.filter((e) => e.status !== 'draft').map((e) => e.slug);
}
