import { toEvent, type EventRow } from '@/lib/content/db-source';
import { isoToAustin } from '@/lib/time';
import type { EventFormValues } from './EventForm';

/** Database row → the editor's field values (times shown in Austin time). */
export function toFormValues(row: EventRow & { announce: boolean; reminder_hours: number | null }): EventFormValues {
  const e = toEvent(row);
  const start = isoToAustin(e.startsAt);
  const end = isoToAustin(e.endsAt);
  const pub = e.publishAt ? isoToAustin(e.publishAt) : null;
  const closes = e.rsvp.closesAt ? isoToAustin(e.rsvp.closesAt) : null;
  return {
    title: e.title,
    slug: e.slug,
    summary: e.summary,
    description: e.description,
    date: start.date,
    start_time: start.time,
    end_date: end.date,
    end_time: end.time,
    location_name: e.locationName,
    address: e.address ?? '',
    image: e.image,
    status: e.status,
    publish_date: pub?.date ?? '',
    publish_time: pub?.time ?? '',
    visibility: e.visibility ?? 'public',
    member_kinds: row.member_kinds ?? [],
    rsvp_mode: e.rsvp.mode,
    capacity: e.rsvp.capacity ? String(e.rsvp.capacity) : '',
    closes_date: closes?.date ?? '',
    closes_time: closes?.time ?? '',
    partner_url: e.rsvp.partner?.url ?? '',
    swoogo_event_id: e.rsvp.partner?.swoogoEventId ?? '',
    feature_on_home: e.featureOnHome,
    card_title: e.homeCard?.title ?? '',
    card_subtitle: e.homeCard?.subtitle ?? '',
    announce: row.announce,
    reminder_hours: row.reminder_hours ? String(row.reminder_hours) : 'none',
    recap_summary: e.recap?.summary ?? '',
    recap_youtube: e.recap?.youtubeUrl ?? '',
    recap_photos: e.recap?.photos ?? [],
  };
}
