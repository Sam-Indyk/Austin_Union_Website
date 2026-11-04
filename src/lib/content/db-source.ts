// Reads site content from Supabase and maps rows to the content model.
import 'server-only';
import { check, publicClient } from '@/lib/supabase/clients';
import type { Database } from '@/lib/supabase/database.types';
import type {
  CollageBanner,
  ContactContent,
  DonateContent,
  EventItem,
  HomeContent,
  ImageRef,
  MissionContent,
  PartnerRegistration,
  SiteSettings,
  TeamContent,
  TeamMember,
} from './types';

type ContentKey = 'settings' | 'home' | 'mission' | 'team_page' | 'donate' | 'contact' | 'collage_banner';

async function content<T>(key: ContentKey): Promise<T> {
  const row = check(await publicClient().from('site_content').select('value').eq('key', key).maybeSingle(), `site_content.${key}`);
  if (!row) throw new Error(`Missing site content "${key}". Run: npm run db:seed`);
  return row.value as unknown as T;
}

export type EventRow = Database['public']['Tables']['events']['Row'];

export function toEvent(r: EventRow): EventItem {
  return {
    id: r.id,
    slug: r.slug,
    status: r.status,
    publishAt: r.publish_at ?? undefined,
    visibility: r.visibility,
    title: r.title,
    summary: r.summary,
    description: r.description,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    locationName: r.location_name,
    address: r.address ?? undefined,
    image: r.image as unknown as ImageRef,
    rsvp: {
      mode: r.rsvp_mode as EventItem['rsvp']['mode'],
      closesAt: r.rsvp_closes_at ?? undefined,
      capacity: r.capacity ?? undefined,
      partner: (r.partner as unknown as PartnerRegistration | null) ?? undefined,
    },
    featureOnHome: r.feature_on_home,
    homeCard: (r.home_card as EventItem['homeCard'] | null) ?? undefined,
    recap: (r.recap as unknown as EventItem['recap'] | null) ?? undefined,
  };
}

export const dbSource = {
  settings: () => content<SiteSettings>('settings'),
  home: () => content<HomeContent>('home'),
  mission: () => content<MissionContent>('mission'),
  donate: () => content<DonateContent>('donate'),
  contact: () => content<ContactContent>('contact'),
  collageBanner: () => content<CollageBanner>('collage_banner'),

  async team(): Promise<TeamContent> {
    const [page, rows] = await Promise.all([
      content<Omit<TeamContent, 'members'>>('team_page'),
      publicClient().from('team_members').select('*').eq('active', true).order('sort_order'),
    ]);
    const members: TeamMember[] = (check(rows, 'team_members') ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      email: m.email ?? undefined,
      photo: m.photo as unknown as ImageRef,
      x: m.x_url ?? undefined,
      linkedin: m.linkedin_url ?? undefined,
    }));
    return { ...page, members };
  },

  /** Public events (RLS hides drafts, unpublished and members-only events from the anon key). */
  async events(): Promise<EventItem[]> {
    const rows = check(await publicClient().from('events').select('*').order('starts_at', { ascending: false }), 'events');
    return (rows ?? []).map(toEvent);
  },
};
