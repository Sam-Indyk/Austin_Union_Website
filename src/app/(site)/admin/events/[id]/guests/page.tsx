import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { requireStaff } from '@/lib/auth/viewer';
import { formatRange } from '@/lib/dates';
import { serviceClient } from '@/lib/supabase/clients';
import { GuestList } from './GuestList';

export const metadata: Metadata = { title: 'Guests' };

async function Guests({ params }: { params: PageProps<'/admin/events/[id]/guests'>['params'] }) {
  const { id } = await params;
  await requireStaff(`/admin/events/${id}/guests`);
  const db = serviceClient();
  const [event, rsvps] = await Promise.all([
    db.from('events').select('id, title, slug, starts_at, ends_at, capacity, partner').eq('id', id).maybeSingle(),
    db.from('rsvps').select('id, first_name, last_name, email, status, checked_in_at, created_at, partner_status').eq('event_id', id).order('last_name').order('first_name'),
  ]);
  if (!event.data) notFound();
  const e = event.data;
  return (
    <>
      <p className="crumbs">
        <Link href="/admin/events">Events</Link> / <Link href={`/admin/events/${e.id}`}>{e.title}</Link> / Guests
      </p>
      <header className="admin__head admin__head--row">
        <div>
          <h1>Guests</h1>
          <p className="muted">
            {e.title} · {formatRange(e.starts_at, e.ends_at)}
          </p>
        </div>
        <a href={`/admin/events/${e.id}/guests/export`} className="ui-btn ui-btn--ghost ui-btn--small" download>
          Download CSV
        </a>
      </header>
      <GuestList
        eventId={e.id}
        capacity={e.capacity}
        partner={Boolean(e.partner)}
        guests={(rsvps.data ?? []).map((r) => ({
          id: r.id,
          name: `${r.first_name} ${r.last_name === '—' ? '' : r.last_name}`.trim(),
          email: r.email.endsWith('@guests.austinunion.org') ? '' : r.email,
          status: r.status as 'going' | 'waitlist' | 'cancelled',
          checkedIn: Boolean(r.checked_in_at),
        }))}
      />
    </>
  );
}

export default function GuestsPage({ params }: PageProps<'/admin/events/[id]/guests'>) {
  return (
    <Suspense fallback={<div className="admin-skeleton" />}>
      <Guests params={params} />
    </Suspense>
  );
}
