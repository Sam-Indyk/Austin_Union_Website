import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense, ViewTransition } from 'react';
import { RsvpButton } from '@/components/events/RsvpDialog';
import { RichText } from '@/components/RichText';
import { FacebookIcon, LinkedInIcon, XIcon } from '@/components/icons';
import { googleCalendarUrl } from '@/lib/calendar';
import { getAllEventSlugs, getEventBySlug } from '@/lib/content/repo';
import { formatRange, formatShortDay } from '@/lib/dates';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.austinunion.org';

export async function generateStaticParams() {
  const slugs = await getAllEventSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<'/events/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const found = await getEventBySlug(slug);
  if (!found) return {};
  const { event } = found;
  return {
    title: event.title,
    description: event.summary,
    openGraph: { title: event.title, description: event.summary, images: [{ url: event.image.src }] },
  };
}

function youtubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return m?.[1];
}

// Known events are prerendered via generateStaticParams; the boundary lets a
// client-side navigation show the page frame instantly while the event streams in.
export default function EventPage({ params }: PageProps<'/events/[slug]'>) {
  return (
    <Suspense fallback={<div className="event-page" style={{ minHeight: '100vh' }} />}>
      <EventContent params={params} />
    </Suspense>
  );
}

async function EventContent({ params }: Pick<PageProps<'/events/[slug]'>, 'params'>) {
  const { slug } = await params;
  const found = await getEventBySlug(slug);
  if (!found) notFound();
  const { event: e, isPast, acceptingRsvps } = found;

  const url = `${SITE}/events/${e.slug}`;
  const when = formatRange(e.startsAt, e.endsAt);
  const calendar = { google: googleCalendarUrl(e), ics: `/events/${e.slug}/event.ics` };
  const rsvpProps = { slug: e.slug, title: e.title, when, calendar };
  const rsvpButton = acceptingRsvps ? <RsvpButton {...rsvpProps} autoOpen /> : null;
  const rsvpButtonLower = acceptingRsvps ? <RsvpButton {...rsvpProps} /> : null;
  const videoId = e.recap?.youtubeUrl ? youtubeId(e.recap.youtubeUrl) : undefined;

  return (
    <article className="event-page">
      <div className="event-page__inner">
        <h1 className="event-title">{e.title}</h1>
        <p className="event-meta">
          {formatShortDay(e.startsAt)}
          <span className="sep">|</span>
          {e.locationName}
        </p>
        <p className="event-summary">{e.summary}</p>

        <div className="event-cta" id="rsvp">
          {rsvpButton ??
            (isPast || e.rsvp.mode === 'native' ? (
              <>
                <p className="event-closed">Registration is closed</p>
                <Link href="/events" className="event-closed">
                  See other events
                </Link>
              </>
            ) : null)}
        </div>

        <ViewTransition name={`event-image-${e.slug}`} share="morph" default="none">
          <div className="event-hero">
            <Image
              src={e.image.src}
              alt={e.image.alt}
              fill
              preload
              sizes="(max-width: 868px) 100vw, 828px"
              style={{ objectPosition: `${e.image.focalX ?? 50}% ${e.image.focalY ?? 50}%` }}
              {...(e.image.blurDataURL ? { placeholder: 'blur' as const, blurDataURL: e.image.blurDataURL } : {})}
            />
          </div>
        </ViewTransition>

        <section className="event-section">
          <h2>Time &amp; Location</h2>
          <p className="event-detail-line">{when}</p>
          <p className="event-detail-line">{[e.locationName, e.address].filter(Boolean).join(', ')}</p>
          {!isPast && (
            <div className="calendar-links">
              <a href={calendar.google} target="_blank" rel="noopener noreferrer">
                Add to Google Calendar
              </a>
              <a href={calendar.ics}>Add to Apple / Outlook (.ics)</a>
            </div>
          )}
        </section>

        {(e.description || rsvpButtonLower) && (
          <section className="event-section">
            <h2>About the Event</h2>
            {e.description && <RichText html={e.description} />}
            {rsvpButtonLower}
          </section>
        )}

        {isPast && e.recap && (videoId || e.recap.photos.length > 0 || e.recap.summary) && (
          <section className="event-section">
            <h2>Event Recap</h2>
            {e.recap.summary && <RichText html={e.recap.summary} />}
            {videoId && (
              <div className="recap-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                  title={`${e.title} — recording`}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            )}
            {e.recap.photos.length > 0 && (
              <ul className="recap-gallery">
                {e.recap.photos.map((p) => (
                  <li key={p.src}>
                    <Image
                      src={p.src}
                      alt={p.alt}
                      fill
                      sizes="(max-width: 868px) 50vw, 280px"
                      {...(p.blurDataURL ? { placeholder: 'blur' as const, blurDataURL: p.blurDataURL } : {})}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="event-section">
          <h2>Share This Event</h2>
          <ul className="share">
            <li>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
                <FacebookIcon />
              </a>
            </li>
            <li>
              <a href={`https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(e.title)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X">
                <XIcon />
              </a>
            </li>
            <li>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">
                <LinkedInIcon />
              </a>
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}
