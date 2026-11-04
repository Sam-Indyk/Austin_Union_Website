// Live state of a vote for the voting page and the projector view (polled).
import { NextResponse } from 'next/server';
import { getViewer } from '@/lib/auth/viewer';
import { loadVote, publicState } from '@/lib/votes/server';

export async function GET(_req: Request, ctx: RouteContext<'/api/votes/[slug]'>) {
  const { slug } = await ctx.params;
  const vote = await loadVote({ slug });
  if (!vote || vote.phase === 'draft') return NextResponse.json({ error: 'not found' }, { status: 404 });
  const state = await publicState(vote, await getViewer());
  return NextResponse.json(state, { headers: { 'Cache-Control': 'no-store' } });
}
