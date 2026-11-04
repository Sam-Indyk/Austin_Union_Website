import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { requireStaff } from '@/lib/auth/viewer';
import { serviceClient } from '@/lib/supabase/clients';
import { EmailsEditor, MembershipEditor, PersonDetailsForm, StaffEditor, DeletePerson } from './PersonForms';

export const metadata: Metadata = { title: 'Person' };

const UATX = /@([a-z0-9-]+\.)*uaustin\.org$/i;
const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' });

async function Person({ params, searchParams }: Pick<PageProps<'/admin/people/[id]'>, 'params' | 'searchParams'>) {
  const { id } = await params;
  const viewer = await requireStaff(`/admin/people/${id}`);
  const sp = await searchParams;
  const db = serviceClient();
  const [person, emails, memberships, staff, rsvps, logins] = await Promise.all([
    db.from('people').select('*').eq('id', id).maybeSingle(),
    db.from('person_emails').select('email, verified_at').eq('person_id', id).order('created_at'),
    db.from('memberships').select('*').eq('person_id', id),
    db.from('staff').select('role').eq('person_id', id).maybeSingle(),
    db.from('rsvps').select('id, status, checked_in_at, created_at, events(slug, title, starts_at)').eq('person_id', id).order('created_at', { ascending: false }),
    db.from('auth_links').select('user_id', { count: 'exact', head: true }).eq('person_id', id),
  ]);
  const p = person.data;
  if (!p) notFound();
  const isAdmin = viewer.staffRole === 'admin';
  const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email;
  const verifiedStudent = (emails.data ?? []).some((e) => e.verified_at && UATX.test(e.email));

  return (
    <>
      <p className="crumbs">
        <Link href="/admin/people">People &amp; Members</Link> / {name}
      </p>
      <header className="admin__head admin__head--row">
        <div>
          <h1>{name}</h1>
          <p className="muted">
            Added {dateFmt.format(new Date(p.created_at))} via {p.source.replace('_', ' ')} ·{' '}
            {(logins.count ?? 0) > 0 ? 'Has signed in' : 'Has not signed in yet'}
          </p>
        </div>
      </header>
      {sp.created && <p className="ui-notice">Added. They can sign in with any of their addresses.</p>}
      {sp.existing && <p className="ui-notice">That email was already on file — here’s the existing record.</p>}
      {!isAdmin && <p className="ui-notice">Only admins can change people and memberships. You can view them.</p>}

      <div className="admin-grid admin-grid--person">
        <div>
          <section className="panel">
            <h2>Details</h2>
            <PersonDetailsForm
              personId={p.id}
              disabled={!isAdmin}
              person={{
                first_name: p.first_name ?? '',
                last_name: p.last_name ?? '',
                email: p.email,
                class_year: p.class_year ? String(p.class_year) : '',
                subscribed: p.subscribed,
                notes: p.notes ?? '',
              }}
            />
          </section>
          <section className="panel">
            <h2>Membership</h2>
            <MembershipEditor
              personId={p.id}
              disabled={!isAdmin}
              verifiedStudent={verifiedStudent}
              classYear={p.class_year}
              memberships={(memberships.data ?? []).map((m) => ({
                kind: m.kind,
                status: m.status,
                ends_on: m.ends_on ?? '',
                honorary_reason: m.honorary_reason ?? '',
                notes: m.notes ?? '',
              }))}
            />
          </section>
        </div>
        <div>
          <section className="panel">
            <h2>Email addresses</h2>
            <EmailsEditor
              personId={p.id}
              contactEmail={p.email}
              disabled={!isAdmin}
              emails={(emails.data ?? []).map((e) => ({ email: e.email, verified: Boolean(e.verified_at) }))}
            />
          </section>
          <section className="panel">
            <h2>Website access</h2>
            <StaffEditor personId={p.id} role={(staff.data?.role as 'admin' | 'editor' | undefined) ?? 'none'} disabled={!isAdmin} self={viewer.personId === p.id} />
          </section>
          <section className="panel">
            <h2>RSVPs</h2>
            {(rsvps.data ?? []).length === 0 ? (
              <p className="prose">None yet.</p>
            ) : (
              <ul className="admin-list">
                {(rsvps.data ?? []).map((r) => (
                  <li key={r.id}>
                    <Link href={`/events/${r.events?.slug}`}>{r.events?.title}</Link>
                    <span className="muted">{r.checked_in_at ? 'Attended' : r.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {isAdmin && viewer.personId !== p.id && <DeletePerson personId={p.id} name={name} />}
        </div>
      </div>
    </>
  );
}

export default function PersonPage({ params, searchParams }: PageProps<'/admin/people/[id]'>) {
  return (
    <Suspense fallback={<div className="admin-skeleton" />}>
      <Person params={params} searchParams={searchParams} />
    </Suspense>
  );
}
