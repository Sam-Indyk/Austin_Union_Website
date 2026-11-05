'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { deleteEvent, duplicateEvent, sendCampaignNow, sendTestEmail } from '../actions';

export function EventTools({ eventId, slug, rsvp, canDelete }: { eventId: string; slug: string; rsvp: boolean; canDelete: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="badge-list" style={{ gap: 10 }}>
      <Link href={`/events/${slug}`} target="_blank" className="ui-btn ui-btn--ghost ui-btn--small">
        View on site ↗
      </Link>
      {rsvp && (
        <Link href={`/admin/events/${eventId}/guests`} className="ui-btn ui-btn--small">
          Guests &amp; check-in
        </Link>
      )}
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--small" disabled={pending} onClick={() => start(() => duplicateEvent(eventId))}>
        Duplicate
      </button>
      {canDelete && (
        <button
          type="button"
          className="ui-btn ui-btn--ghost ui-btn--small"
          disabled={pending}
          onClick={() => confirm('Delete this event and its RSVPs? This can’t be undone.') && start(() => deleteEvent(eventId))}
        >
          Delete
        </button>
      )}
    </div>
  );
}

interface Campaign {
  id: string;
  kind: 'announcement' | 'reminder';
  status: string;
  when: string;
  sent: number;
  failed: number;
  error: string | null;
}

const LABEL: Record<string, string> = { draft: 'Draft', scheduled: 'Scheduled', sending: 'Sending…', sent: 'Sent', cancelled: 'Off' };

export function EmailPanel({ eventId, campaigns }: { eventId: string; campaigns: Campaign[] }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<'announcement' | 'reminder'>('announcement');
  const run = (fn: () => Promise<{ message: string }>) => start(async () => setMsg((await fn()).message));

  return (
    <section className="panel email-panel">
      <h2>Emails</h2>
      {(['announcement', 'reminder'] as const).map((k) => {
        const c = campaigns.find((x) => x.kind === k);
        return (
          <div key={k} className="email-panel__row">
            <div>
              <p className="email-panel__name">{k === 'announcement' ? 'Announcement' : 'Reminder to guests'}</p>
              <p className="muted small">
                {c ? `${LABEL[c.status] ?? c.status}${c.when ? ` · ${c.when}` : ''}${c.sent ? ` · ${c.sent} sent` : ''}${c.failed ? ` · ${c.failed} failed` : ''}` : 'Set up when you save a published event'}
              </p>
              {c?.error && <p className="ui-error small">{c.error}</p>}
            </div>
            {c && (c.status === 'scheduled' || c.status === 'sending') && k === 'announcement' && (
              <button type="button" className="ui-btn ui-btn--small" disabled={pending} onClick={() => confirm('Send the announcement to everyone now?') && run(() => sendCampaignNow(c.id, eventId))}>
                Send now
              </button>
            )}
          </div>
        );
      })}
      <hr className="rule" />
      <div className="email-panel__tabs" role="tablist">
        {(['announcement', 'reminder'] as const).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={kind === k} className={kind === k ? 'is-on' : ''} onClick={() => setKind(k)}>
            {k === 'announcement' ? 'Announcement' : 'Reminder'}
          </button>
        ))}
      </div>
      <div className="email-preview">
        <iframe key={kind} src={`/admin/events/${eventId}/email-preview?kind=${kind}`} title="Email preview" loading="lazy" />
      </div>
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--small ui-btn--block" disabled={pending} onClick={() => run(() => sendTestEmail(eventId, kind))}>
        Send me a test
      </button>
      {msg && <p className="ui-notice small" style={{ marginTop: 10 }}>{msg}</p>}
      <p className="muted small" style={{ marginTop: 10 }}>Preview shows the last saved version.</p>
    </section>
  );
}
