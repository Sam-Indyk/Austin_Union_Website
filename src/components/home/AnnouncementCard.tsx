'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useNow } from '@/lib/use-now';

export interface CardEvent {
  slug: string;
  title: string;
  subtitle?: string;
  dateLabel: string;
  endsAt: string;
}

interface Props {
  events: CardEvent[];
  fallback: { title: string; subtitle: string; linkLabel: string; linkHref: string };
}

const ROTATE_MS = 8000;

/**
 * The red announcement card over the homepage banner.
 *
 * The server already only sends upcoming, featured events (refreshed every
 * minute). This component also re-checks end times in the browser, so a
 * cached page can never show an event that has already finished.
 */
export function AnnouncementCard({ events, fallback }: Props) {
  const now = useNow(60_000);
  const [index, setIndex] = useState(0);

  const live = now === null ? events : events.filter((e) => Date.parse(e.endsAt) > now);

  useEffect(() => {
    if (live.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % live.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [live.length]);

  const event = live.length ? live[index % live.length] : null;

  return (
    <div className="announce">
      <div className="announce__inner">
        <Link href="/" className="announce__seal" aria-label="Austin Union">
          <Image src="/media/site/seal.png" alt="" width={82} height={82} preload />
        </Link>
        <div className="announce__rule" />
        {event ? (
          <>
            <div className="announce__title-row">
              <span className="announce__hand" aria-hidden="true">
                #
              </span>
              <h2 className="announce__title">{event.title}</h2>
            </div>
            {event.subtitle && <p className="announce__subtitle">{event.subtitle}</p>}
            {!event.subtitle && <div style={{ height: 16 }} />}
            <Link className="announce__cta" href={`/events/${event.slug}#rsvp`}>
              RSVP HERE
            </Link>
            <div className="announce__rule announce__rule--bottom" />
            <p className="announce__date">{event.dateLabel}</p>
          </>
        ) : (
          <>
            <div className="announce__title-row">
              <span className="announce__hand" aria-hidden="true">
                #
              </span>
              <h2 className="announce__title">{fallback.title}</h2>
            </div>
            <p className="announce__subtitle">{fallback.subtitle}</p>
            <a className="announce__cta" href={fallback.linkHref}>
              {fallback.linkLabel}
            </a>
            <div className="announce__rule announce__rule--bottom" />
            <p className="announce__date">
              <Link href="/events-1" style={{ color: 'inherit' }}>
                See past events
              </Link>
            </p>
          </>
        )}
        {live.length > 1 && (
          <div className="announce__dots">
            {live.map((e, i) => (
              <button
                key={e.slug}
                type="button"
                aria-label={`Show ${e.title}`}
                aria-current={i === index % live.length}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
