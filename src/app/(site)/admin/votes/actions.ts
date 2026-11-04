'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertStaff } from '@/lib/auth/viewer';
import { serviceClient } from '@/lib/supabase/clients';
import type { Database } from '@/lib/supabase/database.types';
import { loadVote, tally, type VotePhase } from '@/lib/votes/server';
import type { Results } from '@/lib/votes/tally';

type VoteInsert = Database['public']['Tables']['votes']['Insert'];

export interface VoteFormState {
  error?: string;
  message?: string;
}

export interface OptionInput {
  id?: string;
  label: string;
  color: string;
  role: 'side' | 'neutral';
}

const f = (form: FormData, k: string) => String(form.get(k) ?? '').trim();
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/^-|-$/g, '') || 'vote';

function refresh(id?: string) {
  updateTag('votes');
  revalidatePath('/admin/votes');
  if (id) revalidatePath(`/admin/votes/${id}`);
}

export async function saveVote(voteId: string | null, _prev: VoteFormState, form: FormData): Promise<VoteFormState> {
  const viewer = await assertStaff();
  const db = serviceClient();
  const title = f(form, 'title');
  const resolution = f(form, 'resolution');
  if (!title || !resolution) return { error: 'Give the vote a title and the question or motion being voted on.' };

  let options: OptionInput[];
  try {
    options = (JSON.parse(f(form, 'options') || '[]') as OptionInput[]).filter((o) => o.label.trim());
  } catch {
    return { error: 'Could not read the options.' };
  }
  if (options.length < 2) return { error: 'A vote needs at least two options.' };
  if (!options.some((o) => o.role === 'side')) return { error: 'At least one option must be able to win (not “neutral”).' };

  const format = f(form, 'format') === 'pre_post' ? 'pre_post' : 'single';
  const ruleIn = f(form, 'winner_rule');
  const winner_rule = (format === 'single' && ruleIn === 'swing' ? 'plurality' : ruleIn || (format === 'pre_post' ? 'swing' : 'plurality')) as VoteInsert['winner_rule'];
  const eligibility = (f(form, 'eligibility') || 'anyone') as VoteInsert['eligibility'];
  const kinds = form.getAll('member_kinds').map(String) as NonNullable<VoteInsert['member_kinds']>;
  const fields = {
    title,
    resolution,
    description: f(form, 'description'),
    format: format as VoteInsert['format'],
    winner_rule,
    eligibility,
    member_kinds: eligibility === 'members' && kinds.length ? kinds : null,
    results_visibility: (f(form, 'results_visibility') || 'after_round') as VoteInsert['results_visibility'],
    is_anonymous: form.get('is_anonymous') === 'on',
    allow_change: form.get('allow_change') === 'on',
    feature_on_home: form.get('feature_on_home') === 'on',
    event_id: f(form, 'event_id') || null,
  };

  let id = voteId;
  if (!id) {
    let slug = slugify(f(form, 'slug') || title);
    for (let n = 2; (await db.from('votes').select('id').eq('slug', slug).maybeSingle()).data; n++) slug = `${slugify(f(form, 'slug') || title)}-${n}`;
    const { data, error } = await db.from('votes').insert({ ...fields, slug, created_by: viewer.personId }).select('id').single();
    if (error || !data) return { error: error?.message ?? 'Could not create the vote.' };
    id = data.id;
  } else {
    const { error } = await db.from('votes').update(fields).eq('id', id);
    if (error) return { error: error.message };
  }

  // Options: only editable until ballots exist (so results can't be reshuffled).
  const { count } = await db.from('ballots').select('id', { count: 'exact', head: true }).eq('vote_id', id);
  if (!count) {
    const keep = options.filter((o) => o.id).map((o) => o.id!);
    const existing = (await db.from('vote_options').select('id').eq('vote_id', id)).data ?? [];
    const drop = existing.filter((o) => !keep.includes(o.id)).map((o) => o.id);
    if (drop.length) await db.from('vote_options').delete().in('id', drop);
    for (const [i, o] of options.entries()) {
      const row = { vote_id: id, label: o.label.trim(), color: /^#[0-9a-f]{6}$/i.test(o.color) ? o.color : null, role: o.role, sort_order: i };
      if (o.id) await db.from('vote_options').update(row).eq('id', o.id);
      else await db.from('vote_options').insert(row);
    }
  } else {
    for (const o of options.filter((o) => o.id)) {
      await db.from('vote_options').update({ label: o.label.trim(), color: /^#[0-9a-f]{6}$/i.test(o.color) ? o.color : null }).eq('id', o.id!);
    }
  }

  refresh(id);
  if (!voteId) redirect(`/admin/votes/${id}?created=1`);
  return { message: count ? 'Saved. (Options can’t be added or removed once people have voted.)' : 'Saved.' };
}

export async function setPhase(voteId: string, phase: VotePhase): Promise<void> {
  await assertStaff();
  await serviceClient().from('votes').update({ phase, phase_changed_at: new Date().toISOString() }).eq('id', voteId);
  refresh(voteId);
}

export async function resetBallots(voteId: string): Promise<void> {
  await assertStaff();
  await serviceClient().from('ballots').delete().eq('vote_id', voteId);
  refresh(voteId);
}

export async function deleteVote(voteId: string): Promise<void> {
  await assertStaff();
  await serviceClient().from('votes').delete().eq('id', voteId);
  refresh();
  redirect('/admin/votes?deleted=1');
}

/** Full, unredacted counts for officers running the vote. */
export async function adminTally(voteId: string): Promise<{ phase: VotePhase; results: Results } | null> {
  await assertStaff();
  const vote = await loadVote({ id: voteId });
  if (!vote) return null;
  return { phase: vote.phase, results: await tally(vote) };
}
