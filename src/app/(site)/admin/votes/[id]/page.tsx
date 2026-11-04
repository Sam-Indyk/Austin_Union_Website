import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { Suspense } from 'react';
import { requireStaff } from '@/lib/auth/viewer';
import { serviceClient } from '@/lib/supabase/clients';
import { loadVote, phaseLabel, tally } from '@/lib/votes/server';
import { LiveControl } from '../LiveControl';
import { VoteForm } from '../VoteForm';

export const metadata: Metadata = { title: 'Vote' };
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.austinunion.org';

async function Vote({ params, searchParams }: Pick<PageProps<'/admin/votes/[id]'>, 'params' | 'searchParams'>) {
  const { id } = await params;
  await requireStaff(`/admin/votes/${id}`);
  const sp = await searchParams;
  const vote = await loadVote({ id });
  if (!vote) notFound();
  const db = serviceClient();
  const [results, events, ballots] = await Promise.all([
    tally(vote),
    db.from('events').select('id, title').order('starts_at', { ascending: false }).limit(30),
    db.from('ballots').select('id', { count: 'exact', head: true }).eq('vote_id', id),
  ]);
  const joinUrl = `${SITE}/vote/${vote.slug}`;
  const qr = await QRCode.toString(joinUrl, { type: 'svg', margin: 1, color: { dark: '#2f2e2e', light: '#ffffff' } });

  return (
    <>
      <p className="crumbs">
        <Link href="/admin/votes">Votes</Link> / {vote.title}
      </p>
      <header className="admin__head admin__head--row">
        <div>
          <h1>{vote.title}</h1>
          <p className="muted">
            <span className={`phase phase--${vote.phase}`}>{phaseLabel(vote)}</span> · {ballots.count ?? 0} ballots
          </p>
        </div>
      </header>
      {sp.created && vote.phase === 'draft' && <p className="ui-notice">Vote created. It’s hidden until you open it below.</p>}

      <LiveControl
        voteId={vote.id}
        slug={vote.slug}
        format={vote.format}
        initialPhase={vote.phase}
        initialResults={results}
        qrSvg={qr}
        joinUrl={joinUrl.replace(/^https?:\/\//, '')}
      />

      <h2 className="admin__section">Settings</h2>
      <VoteForm
        voteId={vote.id}
        events={events.data ?? []}
        locked={(ballots.count ?? 0) > 0}
        values={{
          title: vote.title,
          resolution: vote.resolution,
          description: vote.description,
          format: vote.format,
          winner_rule: vote.winner_rule,
          eligibility: vote.eligibility,
          member_kinds: vote.member_kinds ?? [],
          results_visibility: vote.results_visibility,
          is_anonymous: vote.is_anonymous,
          allow_change: vote.allow_change,
          feature_on_home: vote.feature_on_home,
          event_id: vote.event_id ?? '',
          options: vote.options.map((o) => ({ id: o.id, label: o.label, color: o.color ?? '#7f1f20', role: o.role as 'side' | 'neutral' })),
        }}
      />
    </>
  );
}

export default function AdminVotePage({ params, searchParams }: PageProps<'/admin/votes/[id]'>) {
  return (
    <Suspense fallback={<div className="admin-skeleton" />}>
      <Vote params={params} searchParams={searchParams} />
    </Suspense>
  );
}
