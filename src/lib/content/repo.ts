// Read access to site content.
//
// Every public page reads through these functions. They are cached with
// `use cache` and tagged, so admin edits can invalidate exactly what changed
// (updateTag('events'), updateTag('team'), …). Time-dependent results
// (upcoming vs. past) use a short lifetime so an event moves to "Past Events"
// within about a minute of ending, with no manual edit.
//
// Content comes from Supabase when it is configured, otherwise from the seed
// module (so the site still runs without a database, e.g. for design work).
import { cacheLife, cacheTag } from 'next/cache';
import { hasDatabase, publicClient } from '@/lib/supabase/clients';
import banner from './collage-banner.json';
import { dbSource } from './db-source';
import mediaMeta from './media-meta.json';
import * as seed from './seed';
import type { CollageBanner, EventItem, ImageRef } from './types';

const META = mediaMeta as Record<string, { width: number; height: number; blurDataURL: string }>;

/** Blurred preview for a static image under /public/media, if one was generated. */
export function blurOf(src: string): string | undefined {
  return META[src]?.blurDataURL;
}

export function withBlur<T extends ImageRef>(img: T): T {
  return img.blurDataURL ? img : { ...img, blurDataURL: blurOf(img.src) };
}

export function withEventMedia(e: EventItem): EventItem {
  return {
    ...e,
    image: withBlur(e.image),
    recap: e.recap && { ...e.recap, photos: e.recap.photos.map(withBlur) },
  };
}

const seedSource = {
  settings: async () => seed.settings,
  home: async () => seed.home,
  mission: async () => seed.mission,
  donate: async () => seed.donate,
  contact: async () => seed.contact,
  collageBanner: async () => banner as CollageBanner,
  team: async () => ({ ...seed.team, members: seed.team.members.map((m) => ({ ...m, photo: withBlur(m.photo) })) }),
  events: async () => seed.events.map(withEventMedia),
};

const source = () => (hasDatabase() ? dbSource : seedSource);

export async function getSettings() {
  'use cache';
  cacheLife('hours');
  cacheTag('settings');
  return source().settings();
}

export async function getHome() {
  'use cache';
  cacheLife('hours');
  cacheTag('home');
  return source().home();
}

export async function getMission() {
  'use cache';
  cacheLife('hours');
  cacheTag('mission');
  return source().mission();
}

export async function getTeam() {
  'use cache';
  cacheLife('hours');
  cacheTag('team');
  return source().team();
}

export async function getDonate() {
  'use cache';
  cacheLife('hours');
  cacheTag('donate');
  return source().donate();
}

export async function getContact() {
  'use cache';
  cacheLife('hours');
  cacheTag('contact');
  return source().contact();
}

/** The composed banner image built from the collage photos. */
export async function getCollageBanner(): Promise<CollageBanner> {
  'use cache';
  cacheLife('hours');
  cacheTag('collage');
  return source().collageBanner();
}

async function allEvents() {
  'use cache';
  cacheLife('minutes');
  cacheTag('events');
  return source().events();
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
  const listed = (await allEvents()).filter((e) => isVisible(e, now) && e.visibility !== 'unlisted' && e.visibility !== 'members');
  const upcoming = listed
    .filter((e) => Date.parse(e.endsAt) > now && e.status !== 'cancelled')
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const past = listed
    .filter((e) => Date.parse(e.endsAt) <= now && e.status !== 'cancelled')
    .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));
  return { upcoming, past, featured: upcoming.filter((e) => e.featureOnHome), asOf: now };
}

export async function getEventBySlug(slug: string) {
  'use cache';
  cacheLife('minutes');
  cacheTag('events', `event:${slug}`);
  const now = Date.now();
  const event = (await allEvents()).find((e) => e.slug === slug && isVisible(e, now));
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
  return (await allEvents()).filter((e) => e.status !== 'draft').map((e) => e.slug);
}

/** The vote to announce on the homepage while it's running (admins toggle "feature on home"). */
export async function getFeaturedVote(): Promise<{ slug: string; resolution: string; phase: string } | null> {
  'use cache';
  cacheLife('minutes');
  cacheTag('votes');
  if (!hasDatabase()) return null;
  const { data } = await publicClient()
    .from('votes')
    .select('slug, resolution, phase')
    .eq('feature_on_home', true)
    .in('phase', ['initial_open', 'initial_closed', 'final_open'])
    .order('phase_changed_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return data;
}
