'use client';

import { useActionState, useMemo, useOptimistic, useState, useTransition } from 'react';
import { addWalkIn, setCheckedIn, setRsvpStatus, type EventFormState } from '../../actions';

interface Guest {
  id: string;
  name: string;
  email: string;
  status: 'going' | 'waitlist' | 'cancelled';
  checkedIn: boolean;
}

type Filter = 'all' | 'here' | 'not-here' | 'waitlist' | 'cancelled';

export function GuestList({ eventId, guests, capacity, partner }: { eventId: string; guests: Guest[]; capacity: number | null; partner: boolean }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [optimistic, apply] = useOptimistic(guests, (list: Guest[], change: { id: string; patch: Partial<Guest> }) =>
    list.map((g) => (g.id === change.id ? { ...g, ...change.patch } : g)),
  );
  const [, start] = useTransition();
  const [walkIn, addAction, adding] = useActionState<EventFormState, FormData>(addWalkIn.bind(null, eventId), {});
  const [showAdd, setShowAdd] = useState(false);

  const going = optimistic.filter((g) => g.status === 'going');
  const here = optimistic.filter((g) => g.checkedIn);
  const waitlist = optimistic.filter((g) => g.status === 'waitlist');
  const cancelled = optimistic.filter((g) => g.status === 'cancelled');

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return optimistic.filter((g) => {
      if (needle && !`${g.name} ${g.email}`.toLowerCase().includes(needle)) return false;
      switch (filter) {
        case 'here':
          return g.checkedIn;
        case 'not-here':
          return !g.checkedIn && g.status === 'going';
        case 'waitlist':
          return g.status === 'waitlist';
        case 'cancelled':
          return g.status === 'cancelled';
        default:
          return g.status !== 'cancelled';
      }
    });
  }, [optimistic, q, filter]);

  const toggle = (g: Guest) =>
    start(async () => {
      apply({ id: g.id, patch: { checkedIn: !g.checkedIn } });
      await setCheckedIn(g.id, !g.checkedIn);
    });
  const status = (g: Guest, s: Guest['status']) =>
    start(async () => {
      apply({ id: g.id, patch: { status: s } });
      await setRsvpStatus(g.id, eventId, s);
    });

  return (
    <>
      <div className="stat-row stat-row--four">
        <div className="stat">
          <span className="stat__num">{going.length}</span>
          <span className="stat__label">going{capacity ? ` of ${capacity}` : ''}</span>
        </div>
        <div className="stat">
          <span className="stat__num">{here.length}</span>
          <span className="stat__label">checked in</span>
        </div>
        <div className="stat">
          <span className="stat__num">{waitlist.length}</span>
          <span className="stat__label">waitlist</span>
        </div>
        <div className="stat">
          <span className="stat__num">{cancelled.length}</span>
          <span className="stat__label">cancelled</span>
        </div>
      </div>
      {partner && <p className="ui-notice">Hosted with UATX — guests were also asked to register on UATX’s page.</p>}

      <div className="guest-tools">
        <input className="ui-input" type="search" placeholder="Find a guest…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a guest" autoFocus />
        <button type="button" className="ui-btn ui-btn--ink" onClick={() => setShowAdd(!showAdd)}>
          + Walk-in
        </button>
      </div>
      {showAdd && (
        <form action={addAction} className="panel walk-in step-in">
          <div className="ui-row">
            <div className="ui-field">
              <label htmlFor="w-first">First name</label>
              <input id="w-first" name="first_name" className="ui-input" required autoFocus />
            </div>
            <div className="ui-field">
              <label htmlFor="w-last">Last name</label>
              <input id="w-last" name="last_name" className="ui-input" />
            </div>
            <div className="ui-field">
              <label htmlFor="w-email">Email (optional)</label>
              <input id="w-email" name="email" type="email" className="ui-input" />
            </div>
          </div>
          <label className="ui-check" style={{ marginBottom: 14 }}>
            <input type="checkbox" name="subscribe" defaultChecked /> Add them to the mailing list
          </label>
          {walkIn.error && <p className="ui-error">{walkIn.error}</p>}
          {walkIn.message && <p className="ui-notice">{walkIn.message}</p>}
          <button className="ui-btn" type="submit" disabled={adding}>
            {adding ? 'Adding…' : 'Add & check in'}
          </button>
        </form>
      )}

      <nav className="chips" aria-label="Show">
        {(
          [
            ['all', `Everyone (${optimistic.length - cancelled.length})`],
            ['not-here', `Not here yet (${going.length - going.filter((g) => g.checkedIn).length})`],
            ['here', `Checked in (${here.length})`],
            ['waitlist', `Waitlist (${waitlist.length})`],
            ['cancelled', `Cancelled (${cancelled.length})`],
          ] as [Filter, string][]
        ).map(([k, label]) => (
          <a
            key={k}
            href="#"
            aria-current={filter === k ? 'true' : undefined}
            onClick={(e) => {
              e.preventDefault();
              setFilter(k);
            }}
          >
            {label}
          </a>
        ))}
      </nav>

      <ul className="guest-list">
        {shown.length === 0 && <li className="guest guest--empty muted">No one here.</li>}
        {shown.map((g) => (
          <li key={g.id} className={`guest${g.checkedIn ? ' is-in' : ''}${g.status !== 'going' ? ` is-${g.status}` : ''}`}>
            <div className="guest__who">
              <span className="guest__name">{g.name}</span>
              <span className="guest__email">{g.email || 'Walk-in'}</span>
            </div>
            <div className="guest__actions">
              {g.status === 'waitlist' && (
                <button type="button" className="ui-link small" onClick={() => status(g, 'going')}>
                  Move to going
                </button>
              )}
              {g.status === 'cancelled' ? (
                <button type="button" className="ui-link small" onClick={() => status(g, 'going')}>
                  Restore
                </button>
              ) : (
                !g.checkedIn && (
                  <button type="button" className="ui-link small muted" onClick={() => confirm(`Cancel ${g.name}’s RSVP?`) && status(g, 'cancelled')}>
                    Cancel
                  </button>
                )
              )}
              {g.status !== 'cancelled' && (
                <button type="button" className={`checkin${g.checkedIn ? ' is-on' : ''}`} onClick={() => toggle(g)} aria-pressed={g.checkedIn}>
                  {g.checkedIn ? '✓ Here' : 'Check in'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
