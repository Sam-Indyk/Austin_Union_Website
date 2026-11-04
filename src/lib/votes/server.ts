// Votes: loading, eligibility, result visibility and ballot keys.
import 'server-only';
import { createHmac, randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import type { Viewer } from '@/lib/auth/viewer';
import { check, serviceClient } from '@/lib/supabase/clients';
import type { Database } from '@/lib/supabase/database.types';
import { computeResults, type Results, type TallyOption } from './tally';

export type VoteRow = Database['public']['Tables']['votes']['Row'];
export type VotePhase = VoteRow['phase'];
export type OptionRow = Database['public']['Tables']['vote_options']['Row'];

export interface VoteWithOptions extends VoteRow {
  options: OptionRow[];
}

export const PHASE_LABEL: Record<VotePhase, string> = {
  draft: 'Draft',
  initial_open: 'Voting open',
  initial_closed: 'Initial results',
  final_open: 'Final vote open',
  closed: 'Final results',
};

export function phaseLabel(v: Pick<VoteRow, 'phase' | 'format'>): string {
  if (v.format === 'single') return v.phase === 'initial_open' ? 'Voting open' : v.phase === 'closed' ? 'Results' : PHASE_LABEL[v.phase];
  return v.phase === 'initial_open' ? 'Initial vote open' : PHASE_LABEL[v.phase];
}

/** Which round is currently accepting ballots (or null). */
export function openRound(v: Pick<VoteRow, 'phase'>): 1 | 2 | null {
  return v.phase === 'initial_open' ? 1 : v.phase === 'final_open' ? 2 : null;
}

export async function loadVote(by: { slug: string } | { id: string }): Promise<VoteWithOptions | null> {
  const db = serviceClient();
  const q = db.from('votes').select('*, options:vote_options(*)');
  const res = 'slug' in by ? await q.eq('slug', by.slug).maybeSingle() : await q.eq('id', by.id).maybeSingle();
  const vote = check(res, 'votes');
  if (!vote) return null;
  return { ...vote, options: [...(vote.options ?? [])].sort((a, b) => a.sort_order - b.sort_order) } as VoteWithOptions;
}

export async function tally(vote: VoteWithOptions): Promise<Results> {
  const rows = check(await serviceClient().rpc('vote_tally', { p_vote: vote.id }), 'vote_tally') ?? [];
  const options: TallyOption[] = vote.options.map((o) => ({ id: o.id, label: o.label, color: o.color, role: o.role as 'side' | 'neutral' }));
  const rule = vote.format === 'single' && vote.winner_rule === 'swing' ? 'plurality' : vote.winner_rule;
  return computeResults(options, rows, vote.format, rule);
}

/** What the public may see right now, given the vote's result-visibility setting. */
export function visibleRounds(vote: Pick<VoteRow, 'phase' | 'results_visibility' | 'format'>): { initial: boolean; final: boolean } {
  const p = vote.phase;
  switch (vote.results_visibility) {
    case 'live':
      return { initial: p !== 'draft', final: p === 'final_open' || p === 'closed' };
    case 'after_round':
      return { initial: p === 'initial_closed' || p === 'final_open' || p === 'closed', final: p === 'closed' };
    case 'after_close':
      return { initial: p === 'closed', final: p === 'closed' };
    case 'admins_only':
      return { initial: false, final: false };
  }
}

export type Eligibility = { ok: true } | { ok: false; reason: 'sign_in' | 'uaustin' | 'members'; message: string };

export function eligibility(vote: VoteRow, viewer: Viewer | null): Eligibility {
  switch (vote.eligibility) {
    case 'anyone':
      return { ok: true };
    case 'signed_in':
      return viewer ? { ok: true } : { ok: false, reason: 'sign_in', message: 'Sign in to vote.' };
    case 'uaustin':
      if (!viewer) return { ok: false, reason: 'sign_in', message: 'Sign in with your UATX account to vote.' };
      return viewer.verifiedStudent
        ? { ok: true }
        : { ok: false, reason: 'uaustin', message: 'This vote is for UATX students. Add and verify your UATX email on your account page.' };
    case 'members': {
      if (!viewer) return { ok: false, reason: 'sign_in', message: 'Sign in to vote — this vote is for members.' };
      const kinds = vote.member_kinds;
      const ok = viewer.memberships.some((m) => m.current && (!kinds || kinds.includes(m.kind)));
      return ok ? { ok: true } : { ok: false, reason: 'members', message: 'This vote is open to members only.' };
    }
  }
}

const DEVICE_COOKIE = 'au_voter';

/** A stable, anonymous key per voter per vote: HMAC of their person id (signed in) or a device token. */
export async function voterKey(voteId: string, viewer: Viewer | null, { create }: { create: boolean }): Promise<string | null> {
  const secret = process.env.VOTE_SECRET;
  if (!secret) throw new Error('VOTE_SECRET is not set.');
  let identity: string | null = viewer ? `person:${viewer.personId}` : null;
  if (!identity) {
    const store = await cookies();
    let token = store.get(DEVICE_COOKIE)?.value;
    if (!token && create) {
      token = randomUUID();
      store.set(DEVICE_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 400, path: '/' });
    }
    if (!token) return null;
    identity = `device:${token}`;
  }
  return createHmac('sha256', secret).update(`${voteId}:${identity}`).digest('hex');
}

export async function myBallots(voteId: string, key: string | null): Promise<{ 1?: string; 2?: string }> {
  if (!key) return {};
  const rows = check(await serviceClient().from('ballots').select('round, option_id').eq('vote_id', voteId).eq('voter_key', key), 'ballots') ?? [];
  const out: { 1?: string; 2?: string } = {};
  for (const r of rows) out[r.round as 1 | 2] = r.option_id;
  return out;
}

/** Everything the public vote page needs, filtered for what may be shown. */
export interface PublicVoteState {
  slug: string;
  title: string;
  resolution: string;
  description: string;
  format: VoteRow['format'];
  phase: VotePhase;
  phaseLabel: string;
  openRound: 1 | 2 | null;
  allowChange: boolean;
  options: { id: string; label: string; color: string | null; role: string }[];
  results: Results | null;
  /** Ballots cast per round — always public (it says nothing about which way people voted). */
  turnout: { initial: number; final: number };
  show: { initial: boolean; final: boolean };
  mine: { 1?: string; 2?: string };
  eligibility: Eligibility;
  updatedAt: string;
}

export async function publicState(vote: VoteWithOptions, viewer: Viewer | null): Promise<PublicVoteState> {
  const show = visibleRounds(vote);
  const key = await voterKey(vote.id, viewer, { create: false });
  const [results, mine] = await Promise.all([tally(vote), myBallots(vote.id, key)]);
  return {
    slug: vote.slug,
    title: vote.title,
    resolution: vote.resolution,
    description: vote.description,
    format: vote.format,
    phase: vote.phase,
    phaseLabel: phaseLabel(vote),
    openRound: openRound(vote),
    allowChange: vote.allow_change,
    options: vote.options.map((o) => ({ id: o.id, label: o.label, color: o.color, role: o.role })),
    results: show.initial || show.final ? redact(results, show, vote.format) : null,
    turnout: { initial: results.totals.initial, final: vote.format === 'pre_post' ? results.totals.final : 0 },
    show,
    mine,
    eligibility: eligibility(vote, viewer),
    updatedAt: vote.phase_changed_at ?? vote.updated_at,
  };
}

/** Hide counts for rounds that aren't public yet. */
function redact(r: Results, show: { initial: boolean; final: boolean }, format: VoteRow['format']): Results {
  if (format === 'single') return r;
  return {
    ...r,
    options: r.options.map((o) => ({
      ...o,
      final: show.final ? o.final : 0,
      finalShare: show.final ? o.finalShare : 0,
      swing: show.final ? o.swing : 0,
      initial: show.initial ? o.initial : 0,
      initialShare: show.initial ? o.initialShare : 0,
    })),
    totals: { initial: show.initial ? r.totals.initial : 0, final: show.final ? r.totals.final : 0 },
    winner: show.final ? r.winner : null,
  };
}
