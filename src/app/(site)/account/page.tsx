import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { signOut } from '@/app/auth/actions';
import { Ornament } from '@/components/Ornament';
import { requireViewer, type ViewerMembership } from '@/lib/auth/viewer';
import { serviceClient } from '@/lib/supabase/clients';
import { AddEmailForm } from './AddEmailForm';

export const metadata: Metadata = { title: 'ACCOUNT', robots: { index: false } };

const KIND_LABEL = { voting: 'Voting Member', associate: 'Associate Member', honorary: 'Honorary Member' } as const;
const REASON = { past_leadership: 'Past leadership', speaker: 'Speaker', alumni: 'Alumnus', other: '' } as Record<string, string>;
const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

function describe(m: ViewerMembership, classYear: number | null) {
  if (m.kind === 'honorary') return REASON[m.honoraryReason ?? ''] || 'For life';
  if (!m.current) return m.status === 'lapsed' ? 'Lapsed' : 'Inactive';
  if (m.kind === 'voting') return classYear ? `Class of ${classYear}` : 'UATX student';
  return m.endsOn ? `Renews ${dateFmt.format(new Date(m.endsOn))}` : 'Active';
}

async function Account() {
  const v = await requireViewer('/account');
  const db = serviceClient();
  const [pages, rsvps] = await Promise.all([
    v.isMember
      ? db.from('member_pages').select('slug, title, member_kinds').eq('published', true).order('sort_order')
      : Promise.resolve({ data: [] as { slug: string; title: string; member_kinds: string[] | null }[] }),
    db
      .from('rsvps')
      .select('status, events!inner(slug, title, starts_at)')
      .eq('person_id', v.personId)
      .neq('status', 'cancelled')
      .gte('events.ends_at', new Date().toISOString()),
  ]);
  const kinds = new Set(v.memberships.filter((m) => m.current).map((m) => m.kind));
  const memberPages = (pages.data ?? []).filter((p) => !p.member_kinds || p.member_kinds.some((k) => kinds.has(k as never)));

  return (
    <>
      <header className="masthead">
        <h1>{v.firstName ? `Welcome, ${v.firstName}` : 'Your Account'}</h1>
        <p className="masthead__motto">
          <Ornament name="scroll" />
          {v.signedInAs}
          <Ornament name="scroll" className="ornament--flip" />
        </p>
      </header>

      <div className="account-grid">
        <div>
          <section className="panel">
            <h2>Membership</h2>
            {v.memberships.length === 0 ? (
              <p className="prose">
                We don’t have a membership on file for this account. If you’re a member, an officer may have added you under a
                different address — add it on the right and we’ll connect the two.
              </p>
            ) : (
              v.memberships.map((m) => (
                <div className="membership" key={m.id}>
                  <span className={`badge badge--${m.current ? m.kind : 'muted'}`}>{KIND_LABEL[m.kind]}</span>
                  <span>{describe(m, v.classYear)}</span>
                </div>
              ))
            )}
            {v.memberships.some((m) => m.kind === 'voting') && !v.verifiedStudent && (
              <p className="ui-notice" style={{ marginTop: 16 }}>
                To vote in Union elections, add and verify your UATX email address.
              </p>
            )}
          </section>

          {memberPages.length > 0 && (
            <section className="panel">
              <h2>Members’ Pages</h2>
              <ul className="email-list">
                {memberPages.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/members/${p.slug}`} className="ui-link" style={{ textDecoration: 'none' }}>
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="panel">
            <h2>Your RSVPs</h2>
            {(rsvps.data ?? []).length === 0 ? (
              <p className="prose">
                No upcoming RSVPs. <Link href="/events" className="ui-link">See upcoming events</Link>
              </p>
            ) : (
              <ul className="email-list">
                {(rsvps.data ?? []).map((r) => (
                  <li key={r.events.slug}>
                    <Link href={`/events/${r.events.slug}`} className="ui-link" style={{ textDecoration: 'none' }}>
                      {r.events.title}
                    </Link>
                    <span className="unverified">{r.status === 'waitlist' ? 'Waitlist' : 'Going'}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div>
          {v.staffRole && (
            <section className="panel" style={{ borderTop: '3px solid var(--red)' }}>
              <h2>Officers</h2>
              <p className="prose" style={{ marginBottom: 16 }}>
                You can edit the site, create events and votes, and manage members.
              </p>
              <Link href="/admin" className="ui-btn ui-btn--block">
                Open the admin
              </Link>
            </section>
          )}

          <section className="panel">
            <h2>Your Email Addresses</h2>
            <p className="prose small" style={{ marginBottom: 10 }}>
              You can sign in with any of these. Mail goes to {v.contactEmail}.
            </p>
            <ul className="email-list">
              {v.emails.map((e) => (
                <li key={e.email}>
                  <span>{e.email}</span>
                  {e.verified ? <span className="verified">✓ Verified</span> : <span className="unverified">Not verified</span>}
                </li>
              ))}
            </ul>
            <AddEmailForm />
          </section>

          <form action={signOut} style={{ marginTop: 22 }}>
            <button className="ui-btn ui-btn--ghost ui-btn--block" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default function AccountPage() {
  return (
    <div className="paper">
      <div className="paper__inner">
        <Suspense fallback={<div style={{ minHeight: 480 }} />}>
          <Account />
        </Suspense>
      </div>
    </div>
  );
}
