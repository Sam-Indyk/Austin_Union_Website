import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireStaff } from '@/lib/auth/viewer';
import { serviceClient } from '@/lib/supabase/clients';
import { ImportClient } from './ImportClient';

export const metadata: Metadata = { title: 'Import contacts' };

const when = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

async function Content() {
  await requireStaff('/admin/people/import', 'admin');
  const past = (await serviceClient().from('contact_imports').select('id, filename, total, created, updated, skipped, created_at').order('created_at', { ascending: false }).limit(5)).data ?? [];
  return (
    <>
      <ImportClient />
      {past.length > 0 && (
        <section className="panel">
          <h3>Earlier imports</h3>
          <ul className="admin-list">
            {past.map((p) => (
              <li key={p.id}>
                <span>
                  {p.filename} <span className="muted small">· {when.format(new Date(p.created_at))}</span>
                </span>
                <span className="muted small">
                  {p.created} new · {p.updated} updated{p.skipped ? ` · ${p.skipped} skipped` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export default function ImportPage() {
  return (
    <>
      <p className="crumbs">
        <Link href="/admin/people">People &amp; Members</Link> / Import contacts
      </p>
      <header className="admin__head">
        <h1>Import contacts</h1>
        <p className="muted">Bring the mailing list over from Wix. Safe to run again — nobody is duplicated or emailed.</p>
      </header>
      <div style={{ maxWidth: 860 }}>
        <Suspense fallback={<div className="admin-skeleton" />}>
          <Content />
        </Suspense>
      </div>
    </>
  );
}
