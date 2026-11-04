import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requireStaff } from '@/lib/auth/viewer';
import { serviceClient } from '@/lib/supabase/clients';
import { InboxItem } from './InboxItem';

export const metadata: Metadata = { title: 'Inbox' };

const PAGE = { '/contact': 'Contact page', '/mission': 'Mission page' } as Record<string, string>;
const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' });

async function Inbox({ searchParams }: { searchParams: PageProps<'/admin/inbox'>['searchParams'] }) {
  await requireStaff('/admin/inbox');
  const sp = await searchParams;
  const archived = sp.view === 'archived';
  let q = serviceClient().from('messages').select('*').order('created_at', { ascending: false }).limit(200);
  q = archived ? q.not('archived_at', 'is', null) : q.is('archived_at', null);
  const { data } = await q;
  const messages = data ?? [];
  return (
    <>
      <header className="admin__head admin__head--row">
        <div>
          <h1>Inbox</h1>
          <p className="muted">Messages sent through the Contact and Mission page forms.</p>
        </div>
      </header>
      <nav className="chips" aria-label="View">
        <a href="/admin/inbox" aria-current={!archived ? 'true' : undefined}>
          Inbox
        </a>
        <a href="/admin/inbox?view=archived" aria-current={archived ? 'true' : undefined}>
          Archived
        </a>
      </nav>
      {messages.length === 0 ? (
        <section className="panel empty">
          <p className="prose">{archived ? 'Nothing archived.' : 'No messages. When someone writes in, it appears here.'}</p>
        </section>
      ) : (
        <div className="inbox">
          {messages.map((m) => (
            <InboxItem
              key={m.id}
              id={m.id}
              name={m.name || m.email}
              email={m.email}
              body={m.body}
              when={dateFmt.format(new Date(m.created_at))}
              from={PAGE[m.page] ?? m.page}
              unread={!m.read_at}
              archived={Boolean(m.archived_at)}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default function InboxPage({ searchParams }: PageProps<'/admin/inbox'>) {
  return (
    <Suspense fallback={<div className="admin-skeleton" />}>
      <Inbox searchParams={searchParams} />
    </Suspense>
  );
}
