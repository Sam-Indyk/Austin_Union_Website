import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { requireStaff } from '@/lib/auth/viewer';
import { serviceClient } from '@/lib/supabase/clients';
import { EventForm } from '../EventForm';
import { toFormValues } from '../values';
import { EmailPanel, EventTools } from './EventTools';
import { nowMs } from '@/lib/time';

export const metadata: Metadata = { title: 'Event' };

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' });

async function EditEvent({ params, searchParams }: Pick<PageProps<'/admin/events/[id]'>, 'params' | 'searchParams'>) {
  const { id } = await params;
  const viewer = await requireStaff(`/admin/events/${id}`);
  const sp = await searchParams;
  const db = serviceClient();
  const [row, campaigns, rsvps] = await Promise.all([
    db.from('events').select('*').eq('id', id).maybeSingle(),
    db.from('email_campaigns').select('id, kind, status, scheduled_at, sent_at, sent_count, failed_count, last_error').eq('event_id', id),
    db.from('rsvps').select('status, checked_in_at').eq('event_id', id),
  ]);
  const e = row.data;
  if (!e) notFound();
  const isPast = Date.parse(e.ends_at) <= nowMs();
  const going = (rsvps.data ?? []).filter((r) => r.status === 'going').length;
  const attended = (rsvps.data ?? []).filter((r) => r.checked_in_at).length;

  return (
    <>
      <p className="crumbs">
        <Link href="/admin/events">Events</Link> / {e.title}
      </p>
      <header className="admin__head admin__head--row">
        <div>
          <h1>{e.title}</h1>
          <p className="muted">
            {e.status === 'draft' ? 'Draft' : e.status === 'cancelled' ? 'Cancelled' : isPast ? 'Past event' : 'Published'}
            {e.rsvp_mode === 'native' && ` · ${going} going${isPast ? ` · ${attended} attended` : ''}`}
          </p>
        </div>
        <EventTools eventId={e.id} slug={e.slug} rsvp={e.rsvp_mode === 'native'} canDelete={viewer.staffRole === 'admin'} />
      </header>
      {sp.created && <p className="ui-notice">Event created{e.status === 'published' ? ' and published' : ''}.</p>}
      {sp.duplicated && <p className="ui-notice">This is a copy, saved as a draft. Update the date and details, then publish.</p>}

      <div className="event-edit">
        <EventForm eventId={e.id} values={toFormValues(e)} isPast={isPast} published={e.status !== 'draft'} />
        <aside className="event-edit__side">
          <EmailPanel
            eventId={e.id}
            campaigns={(campaigns.data ?? []).map((c) => ({
              id: c.id,
              kind: c.kind as 'announcement' | 'reminder',
              status: c.status,
              when: c.sent_at ? `Sent ${dateFmt.format(new Date(c.sent_at))}` : c.scheduled_at ? dateFmt.format(new Date(c.scheduled_at)) : '',
              sent: c.sent_count,
              failed: c.failed_count,
              error: c.last_error,
            }))}
          />
        </aside>
      </div>
    </>
  );
}

export default function EditEventPage({ params, searchParams }: PageProps<'/admin/events/[id]'>) {
  return (
    <Suspense fallback={<div className="admin-skeleton" />}>
      <EditEvent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
