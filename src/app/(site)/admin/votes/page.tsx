import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireStaff } from '@/lib/auth/viewer';
import { serviceClient } from '@/lib/supabase/clients';
import { phaseLabel } from '@/lib/votes/server';

export const metadata: Metadata = { title: 'Votes' };

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' });

async function Votes({ searchParams }: { searchParams: PageProps<'/admin/votes'>['searchParams'] }) {
  await requireStaff('/admin/votes');
  const sp = await searchParams;
  const { data } = await serviceClient()
    .from('votes')
    .select('id, slug, title, resolution, phase, format, created_at, ballots(count)')
    .order('created_at', { ascending: false });
  const votes = data ?? [];
  return (
    <>
      <header className="admin__head admin__head--row">
        <div>
          <h1>Votes</h1>
          <p className="muted">Straw polls and debate votes. Officer elections are run separately.</p>
        </div>
        <Link href="/admin/votes/new" className="ui-btn">
          Create a vote
        </Link>
      </header>
      {sp.deleted && <p className="ui-notice">Vote deleted.</p>}
      {votes.length === 0 ? (
        <section className="panel empty">
          <h2>No votes yet</h2>
          <p className="prose">
            Create one for your next debate: the audience votes Yea, Nay or Undecided before and after, and the site shows who won the room.
          </p>
          <Link href="/admin/votes/new" className="ui-btn" style={{ marginTop: 14 }}>
            Create a vote
          </Link>
        </section>
      ) : (
        <div className="table-wrap panel">
          <table className="table">
            <thead>
              <tr>
                <th>Vote</th>
                <th>Format</th>
                <th>Status</th>
                <th>Ballots</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {votes.map((v) => (
                <tr key={v.id}>
                  <td>
                    <Link href={`/admin/votes/${v.id}`} className="table__primary">
                      {v.title}
                    </Link>
                    <div className="muted small">{v.resolution}</div>
                  </td>
                  <td>{v.format === 'pre_post' ? 'Initial + final' : 'Single'}</td>
                  <td>
                    <span className={`phase phase--${v.phase}`}>{phaseLabel(v)}</span>
                  </td>
                  <td>{(v.ballots as unknown as { count: number }[])[0]?.count ?? 0}</td>
                  <td className="muted">{dateFmt.format(new Date(v.created_at))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function VotesAdmin({ searchParams }: PageProps<'/admin/votes'>) {
  return (
    <Suspense fallback={<div className="admin-skeleton" />}>
      <Votes searchParams={searchParams} />
    </Suspense>
  );
}
