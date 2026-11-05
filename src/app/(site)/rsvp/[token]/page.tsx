import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { Ornament } from '@/components/Ornament';
import { formatRange } from '@/lib/dates';
import { serviceClient } from '@/lib/supabase/clients';
import { cancelRsvp, restoreRsvp } from './actions';
import { nowMs } from '@/lib/time';

export const metadata: Metadata = { title: 'YOUR RSVP', robots: { index: false } };

async function Manage({ params }: { params: PageProps<'/rsvp/[token]'>['params'] }) {
  await connection();
  const { token } = await params;
  const row = /^[0-9a-f-]{36}$/i.test(token)
    ? (await serviceClient().from('rsvps').select('first_name, status, events(title, slug, starts_at, ends_at, location_name)').eq('manage_token', token).maybeSingle()).data
    : null;
  if (!row?.events) return <p className="prose" style={{ textAlign: 'center' }}>We couldn’t find this RSVP.</p>;
  const e = row.events;
  const past = Date.parse(e.ends_at) < nowMs();
  return (
    <div style={{ textAlign: 'center' }}>
      <h2>{e.title}</h2>
      <p className="prose">
        {formatRange(e.starts_at, e.ends_at)}
        <br />
        {e.location_name}
      </p>
      <hr className="rule" />
      {row.status === 'cancelled' ? (
        <form action={restoreRsvp}>
          <input type="hidden" name="token" value={token} />
          <p className="prose" style={{ marginBottom: 18 }}>
            Your RSVP is cancelled{row.first_name ? `, ${row.first_name}` : ''}.
          </p>
          {!past && (
            <button className="ui-btn ui-btn--ghost" type="submit">
              I can come after all
            </button>
          )}
        </form>
      ) : (
        <form action={cancelRsvp}>
          <input type="hidden" name="token" value={token} />
          <p className="prose" style={{ marginBottom: 18 }}>
            {row.status === 'waitlist' ? 'You’re on the waitlist.' : 'You’re going.'}
          </p>
          {!past && (
            <button className="ui-btn" type="submit">
              Cancel my RSVP
            </button>
          )}
        </form>
      )}
      <p className="prose small" style={{ marginTop: 22 }}>
        <Link href={`/events/${e.slug}`} className="ui-link">
          Event details
        </Link>
      </p>
    </div>
  );
}

export default function ManageRsvpPage({ params }: PageProps<'/rsvp/[token]'>) {
  return (
    <div className="paper">
      <div className="paper__inner paper__inner--narrow">
        <header className="masthead">
          <h1>Your RSVP</h1>
          <p className="masthead__motto">
            <Ornament name="scroll" />
            Austin Union
            <Ornament name="scroll" className="ornament--flip" />
          </p>
        </header>
        <div className="frame">
          <div className="frame__inner">
            <Suspense fallback={<div style={{ minHeight: 200 }} />}>
              <Manage params={params} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
