import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireStaff } from '@/lib/auth/viewer';
import { formatShortDay } from '@/lib/dates';
import { serviceClient } from '@/lib/supabase/clients';
import { nowMs } from '@/lib/time';

export const metadata: Metadata = { title: 'Events' };

type Tab = 'upcoming' | 'drafts' | 'past';

function statusOf(e: { status: string; publish_at: string | null; ends_at: string; visibility: string }, now: number) {
  if (e.status === 'draft') return { label: 'Draft', cls: 'muted' };
  if (e.status === 'cancelled') return { label: 'Cancelled', cls: 'muted' };
  if (e.publish_at && Date.parse(e.publish_at) > now) return { label: 'Scheduled', cls: 'honorary' };
  if (Date.parse(e.ends_at) <= now) return { label: 'Past', cls: 'associate' };
  return { label: e.visibility === 'members' ? 'Live · members' : e.visibility === 'unlisted' ? 'Live · link only' : 'Live', cls: 'voting' };
}

async function Events({ searchParams }: { searchParams: PageProps<'/admin/events'>['searchParams'] }) {
  await requireStaff('/admin/events');
  const sp = await searchParams;
  const tab = (['upcoming', 'drafts', 'past'].includes(String(sp.tab)) ? sp.tab : 'upcoming') as Tab;
  const { data } = await serviceClient()
    .from('events')
    .select('id, slug, title, status, publish_at, starts_at, ends_at, visibility, capacity, feature_on_home, rsvp_mode, image, rsvps(status)')
    .order('starts_at', { ascending: tab !== 'past' });
  const now = nowMs();
  const all = data ?? [];
  const rows = all.filter((e) =>
    tab === 'drafts' ? e.status === 'draft' : tab === 'past' ? e.status !== 'draft' && Date.parse(e.ends_at) <= now : e.status !== 'draft' && Date.parse(e.ends_at) > now,
  );
  const count = (t: Tab) =>
    all.filter((e) => (t === 'drafts' ? e.status === 'draft' : t === 'past' ? e.status !== 'draft' && Date.parse(e.ends_at) <= now : e.status !== 'draft' && Date.parse(e.ends_at) > now)).length;

  return (
    <>
      <header className="admin__head admin__head--row">
        <div>
          <h1>Events</h1>
          <p className="muted">Published events appear on the site and move to Past Events on their own when they end.</p>
        </div>
        <Link href="/admin/events/new" className="ui-btn">
          Create an event
        </Link>
      </header>
      {sp.deleted && <p className="ui-notice">Event deleted.</p>}
      <nav className="chips" aria-label="Show">
        {(['upcoming', 'drafts', 'past'] as Tab[]).map((t) => (
          <Link key={t} href={`/admin/events?tab=${t}`} aria-current={tab === t ? 'true' : undefined}>
            {t === 'upcoming' ? 'Upcoming' : t === 'drafts' ? 'Drafts' : 'Past'} ({count(t)})
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <section className="panel empty">
          <p className="prose">{tab === 'upcoming' ? 'No upcoming events. Create one and it appears on the homepage and Events page.' : 'Nothing here.'}</p>
        </section>
      ) : (
        <div className="event-rows">
          {rows.map((e) => {
            const st = statusOf(e, now);
            const going = (e.rsvps ?? []).filter((r) => r.status === 'going').length;
            const wait = (e.rsvps ?? []).filter((r) => r.status === 'waitlist').length;
            const img = e.image as unknown as { src: string; blurDataURL?: string } | null;
            return (
              <article key={e.id} className="event-row panel">
                <Link href={`/admin/events/${e.id}`} className="event-row__img" style={{ backgroundImage: img ? `url("${img.blurDataURL ?? img.src}")` : undefined }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail */}
                  {img && <img src={img.src} alt="" loading="lazy" />}
                </Link>
                <div className="event-row__main">
                  <p className="event-row__date">{formatShortDay(e.starts_at)}</p>
                  <Link href={`/admin/events/${e.id}`} className="event-row__title">
                    {e.title}
                  </Link>
                  <p className="badge-list" style={{ marginTop: 8 }}>
                    <span className={`badge badge--${st.cls}`}>{st.label}</span>
                    {e.feature_on_home && st.label.startsWith('Live') && <span className="badge badge--muted">On homepage</span>}
                  </p>
                </div>
                <div className="event-row__rsvps">
                  {e.rsvp_mode === 'native' ? (
                    <>
                      <span className="stat__num">{going}</span>
                      <span className="muted small">
                        {e.capacity ? `of ${e.capacity} ` : ''}going{wait ? ` · ${wait} waitlist` : ''}
                      </span>
                    </>
                  ) : (
                    <span className="muted small">No RSVP</span>
                  )}
                </div>
                <div className="event-row__actions">
                  {e.rsvp_mode === 'native' && (
                    <Link href={`/admin/events/${e.id}/guests`} className="ui-btn ui-btn--small">
                      Guests &amp; check-in
                    </Link>
                  )}
                  <Link href={`/admin/events/${e.id}`} className="ui-btn ui-btn--ghost ui-btn--small">
                    Edit
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function EventsAdmin({ searchParams }: PageProps<'/admin/events'>) {
  return (
    <Suspense fallback={<div className="admin-skeleton" />}>
      <Events searchParams={searchParams} />
    </Suspense>
  );
}
