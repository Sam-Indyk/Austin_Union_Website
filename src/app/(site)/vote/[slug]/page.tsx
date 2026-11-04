import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Ornament } from '@/components/Ornament';
import { VoteClient } from '@/components/votes/VoteClient';
import { getViewer } from '@/lib/auth/viewer';
import { loadVote, publicState } from '@/lib/votes/server';

export async function generateMetadata({ params }: PageProps<'/vote/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const vote = await loadVote({ slug });
  return vote && vote.phase !== 'draft'
    ? { title: `VOTE · ${vote.title}`, description: vote.resolution, robots: { index: false } }
    : { title: 'VOTE' };
}

async function Vote({ params }: Pick<PageProps<'/vote/[slug]'>, 'params'>) {
  const { slug } = await params;
  const vote = await loadVote({ slug });
  if (!vote || vote.phase === 'draft') notFound();
  const state = await publicState(vote, await getViewer());
  return (
    <>
      <header className="masthead vote-head">
        <p className="masthead__motto">
          <Ornament name="scroll" />
          The Austin Union Votes
          <Ornament name="scroll" className="ornament--flip" />
        </p>
        <h1>{vote.resolution}</h1>
        {vote.description && <p className="masthead__lede">{vote.description}</p>}
      </header>
      <VoteClient initial={state} />
    </>
  );
}

export default function VotePage({ params }: PageProps<'/vote/[slug]'>) {
  return (
    <div className="paper">
      <div className="paper__inner paper__inner--vote">
        <Suspense fallback={<div style={{ minHeight: 520 }} />}>
          <Vote params={params} />
        </Suspense>
      </div>
    </div>
  );
}
