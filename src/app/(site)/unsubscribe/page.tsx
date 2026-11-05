import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { Ornament } from '@/components/Ornament';
import { serviceClient } from '@/lib/supabase/clients';
import { resubscribe, unsubscribe } from './actions';

export const metadata: Metadata = { title: 'UNSUBSCRIBE', robots: { index: false } };

const TOKEN = /^[0-9a-f-]{36}$/i;

// A button (not an automatic unsubscribe on page load): email security scanners
// open every link, and shouldn't unsubscribe people by doing so.
async function Panel({ searchParams }: { searchParams: PageProps<'/unsubscribe'>['searchParams'] }) {
  await connection();
  const sp = await searchParams;
  const t = typeof sp.t === 'string' && TOKEN.test(sp.t) ? sp.t : null;
  const person = t
    ? (await serviceClient().from('people').select('email, subscribed').eq('unsubscribe_token', t).maybeSingle()).data
    : null;
  if (!person) return <p className="prose" style={{ textAlign: 'center' }}>This link isn’t valid. If you keep receiving emails you don’t want, reply to one and we’ll remove you.</p>;
  return person.subscribed ? (
    <form action={unsubscribe} style={{ textAlign: 'center' }}>
      <input type="hidden" name="t" value={t!} />
      <p className="prose" style={{ marginBottom: 22 }}>
        Stop sending Austin Union announcements to <strong>{person.email}</strong>?
      </p>
      <button className="ui-btn" type="submit">
        Unsubscribe
      </button>
      <p className="prose small" style={{ marginTop: 18 }}>
        You’ll still get confirmations and reminders for events you RSVP to.
      </p>
    </form>
  ) : (
    <form action={resubscribe} style={{ textAlign: 'center' }}>
      <input type="hidden" name="t" value={t!} />
      <p className="prose" style={{ marginBottom: 22 }}>
        <strong>{person.email}</strong> is unsubscribed. We’re sorry to see you go.
      </p>
      <button className="ui-btn ui-btn--ghost" type="submit">
        Changed your mind? Resubscribe
      </button>
    </form>
  );
}

export default function UnsubscribePage({ searchParams }: PageProps<'/unsubscribe'>) {
  return (
    <div className="paper">
      <div className="paper__inner paper__inner--narrow">
        <header className="masthead">
          <h1>Email Preferences</h1>
          <p className="masthead__motto">
            <Ornament name="scroll" />
            Austin Union
            <Ornament name="scroll" className="ornament--flip" />
          </p>
        </header>
        <div className="frame">
          <div className="frame__inner">
            <Suspense fallback={<div style={{ minHeight: 140 }} />}>
              <Panel searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
