import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ViewTransition } from 'react';
import { PastEventCard, type PastCardData } from '@/components/events/PastEventCard';
import { RsvpButton } from '@/components/events/RsvpDialog';
import { googleCalendarUrl } from '@/lib/calendar';
import { getEventTimeline } from '@/lib/content/repo';
import { formatRange, formatShortDay } from '@/lib/dates';

export const metadata: Metadata = { title: 'EVENTS' };

export default async function EventsPage() {
  const { upcoming, past } = await getEventTimeline();

  const pastCards: PastCardData[] = past.map((e) => ({
    slug: e.slug,
    title: e.title,
    summary: e.summary,
    dayLabel: formatShortDay(e.startsAt),
    locationName: e.locationName,
    image: e.image,
    buttonLabel: e.rsvp.mode === 'native' ? 'Details' : 'Learn more',
  }));

  return (
    <div className="page">
      <section className="events-upcoming" aria-labelledby="upcoming-title">
        <h1 className="shadow-heading" id="upcoming-title">
          Upcoming Events
        </h1>
        <p className="events-upcoming__intro">For more information on upcoming events, please click &apos;RSVP.&apos;</p>
        {upcoming.length === 0 ? (
          <p className="events-upcoming__empty">New events are coming soon — join the mailing list to hear first.</p>
        ) : (
          upcoming.map((e, i) => (
            <article key={e.id} className="upcoming-card" data-edit={`event:${e.id}`} data-edit-label={e.title}>
              <ViewTransition name={`event-image-${e.slug}`} share="morph" default="none">
                <Link href={`/events/${e.slug}`} className="upcoming-card__image" tabIndex={-1} aria-hidden="true">
                  <Image
                    src={e.image.src}
                    alt=""
                    fill
                    sizes="(max-width: 1100px) 100vw, 700px"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    style={{ objectPosition: `${e.image.focalX ?? 50}% ${e.image.focalY ?? 50}%` }}
                    {...(e.image.blurDataURL ? { placeholder: 'blur' as const, blurDataURL: e.image.blurDataURL } : {})}
                  />
                </Link>
              </ViewTransition>
              <div className="upcoming-card__body">
                <h2>
                  <Link href={`/events/${e.slug}`} className="upcoming-card__title">
                    {e.title}
                  </Link>
                </h2>
                <p className="upcoming-card__meta">
                  <span className="day">{formatShortDay(e.startsAt)}</span>
                  <span className="sep">|</span>
                  {e.locationName}
                </p>
                {e.rsvp.mode === 'native' ? (
                  <RsvpButton
                    slug={e.slug}
                    title={e.title}
                    when={formatRange(e.startsAt, e.endsAt)}
                    calendar={{ google: googleCalendarUrl(e), ics: `/events/${e.slug}/event.ics` }}
                    className="btn"
                  />
                ) : (
                  <Link href={`/events/${e.slug}`} className="btn">
                    Details
                  </Link>
                )}
              </div>
            </article>
          ))
        )}
      </section>

      <section className="events-past" aria-labelledby="past-title">
        <h2 className="shadow-heading" id="past-title">
          Past Events
        </h2>
        <ul className="past-grid">
          {pastCards.map((e) => (
            <PastEventCard key={e.slug} e={e} />
          ))}
        </ul>
      </section>
    </div>
  );
}
