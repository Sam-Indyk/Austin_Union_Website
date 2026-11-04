import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { Ornament } from '@/components/Ornament';
import { hasDatabase, serviceClient } from '@/lib/supabase/clients';
import { phaseLabel } from '@/lib/votes/server';

export const metadata: Metadata = { title: 'VOTE' };

/** /vote goes straight to the vote that's open (the link shown on screen at events). */
async function Votes() {
  await connection();
  if (!hasDatabase()) return <p className="prose">No votes yet.</p>;
  const { data } = await serviceClient()
    .from('votes')
    .select('slug, title, resolution, phase, format, phase_changed_at')
    .neq('phase', 'draft')
    .order('phase_changed_at', { ascending: false, nullsFirst: false })
    .limit(20);
  const votes = data ?? [];
  const live = votes.filter((v) => v.phase !== 'closed');
  if (live.length === 1) redirect(`/vote/${live[0].slug}`);

  return (
    <>
      {live.length === 0 && <p className="prose" style={{ textAlign: 'center', marginBottom: 28 }}>There’s no vote open right now.</p>}
      <div className="vote-list">
        {votes.map((v) => (
          <Link key={v.slug} href={`/vote/${v.slug}`} className="panel vote-list__item">
            <span className={`phase phase--${v.phase}`}>{phaseLabel(v)}</span>
            <h2>{v.resolution}</h2>
            <span className="muted small">{v.title}</span>
          </Link>
        ))}
      </div>
    </>
  );
}

export default function VoteIndex() {
  return (
    <div className="paper">
      <div className="paper__inner paper__inner--narrow">
        <header className="masthead">
          <h1>Votes</h1>
          <p className="masthead__motto">
            <Ornament name="scroll" />
            Veritas per disputandem
            <Ornament name="scroll" className="ornament--flip" />
          </p>
        </header>
        <Suspense fallback={<div style={{ minHeight: 200 }} />}>
          <Votes />
        </Suspense>
      </div>
    </div>
  );
}
