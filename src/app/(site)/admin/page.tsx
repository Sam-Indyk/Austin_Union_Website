import Link from 'next/link';
import { Suspense } from 'react';
import { requireStaff } from '@/lib/auth/viewer';
import { serviceClient } from '@/lib/supabase/clients';
import { phaseLabel } from '@/lib/votes/server';

async function Overview() {
  const viewer = await requireStaff('/admin');
  const db = serviceClient();
  const now = new Date().toISOString();
  const [subs, members, unread, events, votes] = await Promise.all([
    db.from('people').select('id', { count: 'exact', head: true }).eq('subscribed', true),
    db.from('memberships').select('person_id, kind, status, ends_on'),
    db.from('messages').select('id', { count: 'exact', head: true }).is('read_at', null).is('archived_at', null),
    db.from('events').select('id, slug, title, starts_at, rsvps(count)').gte('ends_at', now).neq('status', 'draft').order('starts_at').limit(5),
    db.from('votes').select('id, slug, title, phase, format').order('created_at', { ascending: false }).limit(5),
  ]);
  const today = now.slice(0, 10);
  const current = (members.data ?? []).filter((m) => m.status === 'active' && (!m.ends_on || m.ends_on >= today));
  const memberCount = new Set(current.map((m) => m.person_id)).size;

  return (
    <>
      <header className="admin__head">
        <h1>Good to see you, {viewer.firstName ?? 'officer'}</h1>
        <p className="muted">Everything the website does on its own — and the few things it needs from you.</p>
      </header>

      <div className="stat-row">
        <Link href="/admin/people?filter=subscribers" className="stat">
          <span className="stat__num">{subs.count ?? 0}</span>
          <span className="stat__label">on the mailing list</span>
        </Link>
        <Link href="/admin/people?filter=members" className="stat">
          <span className="stat__num">{memberCount}</span>
          <span className="stat__label">current members</span>
        </Link>
        <Link href="/admin/inbox" className="stat">
          <span className="stat__num">{unread.count ?? 0}</span>
          <span className="stat__label">unread messages</span>
        </Link>
      </div>

      <div className="admin-grid">
        <section className="panel">
          <div className="panel__head">
            <h2>Upcoming events</h2>
            <Link href="/admin/events/new" className="ui-btn ui-btn--small">
              New event
            </Link>
          </div>
          {(events.data ?? []).length === 0 ? (
            <p className="prose">No upcoming events.</p>
          ) : (
            <ul className="admin-list">
              {(events.data ?? []).map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/events/${e.id}`}>{e.title}</Link>
                  <Link href={`/admin/events/${e.id}/guests`} className="muted">
                    {(e.rsvps as unknown as { count: number }[])[0]?.count ?? 0} RSVPs
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="small" style={{ marginTop: 14 }}>
            <Link href="/admin/events" className="ui-link">
              All events, drafts &amp; check-in →
            </Link>
          </p>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>Votes</h2>
            <Link href="/admin/votes/new" className="ui-btn ui-btn--small">
              New vote
            </Link>
          </div>
          {(votes.data ?? []).length === 0 ? (
            <p className="prose">No votes yet.</p>
          ) : (
            <ul className="admin-list">
              {(votes.data ?? []).map((v) => (
                <li key={v.id}>
                  <Link href={`/admin/votes/${v.id}`}>{v.title}</Link>
                  <span className={`phase phase--${v.phase}`}>{phaseLabel(v)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

export default function AdminHome() {
  return (
    <Suspense fallback={<div className="admin-skeleton" />}>
      <Overview />
    </Suspense>
  );
}
