'use server';

import { getViewer } from '@/lib/auth/viewer';
import { serviceClient } from '@/lib/supabase/clients';
import { eligibility, loadVote, openRound, publicState, voterKey, type PublicVoteState } from '@/lib/votes/server';

export type BallotResult = { ok: true; state: PublicVoteState } | { ok: false; error: string; state?: PublicVoteState };

export async function castBallot(slug: string, optionId: string): Promise<BallotResult> {
  const vote = await loadVote({ slug });
  if (!vote || vote.phase === 'draft') return { ok: false, error: 'This vote isn’t open.' };
  const viewer = await getViewer();
  const round = openRound(vote);
  if (!round) return { ok: false, error: 'Voting is closed right now.', state: await publicState(vote, viewer) };
  const elig = eligibility(vote, viewer);
  if (!elig.ok) return { ok: false, error: elig.message, state: await publicState(vote, viewer) };
  if (!vote.options.some((o) => o.id === optionId)) return { ok: false, error: 'Unknown option.' };

  const key = (await voterKey(vote.id, viewer, { create: true }))!;
  const db = serviceClient();
  const row = {
    vote_id: vote.id,
    round,
    option_id: optionId,
    voter_key: key,
    person_id: vote.is_anonymous || !viewer ? null : viewer.personId,
  };
  if (vote.allow_change) {
    const { error } = await db.from('ballots').upsert(row, { onConflict: 'vote_id,round,voter_key' });
    if (error) return { ok: false, error: 'Your vote didn’t go through. Please try again.' };
  } else {
    const { error } = await db.from('ballots').insert(row);
    if (error?.code === '23505') return { ok: false, error: 'You’ve already voted in this round.', state: await publicState(vote, viewer) };
    if (error) return { ok: false, error: 'Your vote didn’t go through. Please try again.' };
  }
  return { ok: true, state: await publicState(vote, viewer) };
}
