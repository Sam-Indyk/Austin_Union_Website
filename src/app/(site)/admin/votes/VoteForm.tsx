'use client';

import { useActionState, useState } from 'react';
import { DEFAULT_COLORS } from '@/lib/votes/tally';
import { saveVote, type OptionInput, type VoteFormState } from './actions';

export interface VoteFormValues {
  title: string;
  resolution: string;
  description: string;
  format: 'single' | 'pre_post';
  winner_rule: 'plurality' | 'swing' | 'none';
  eligibility: 'anyone' | 'signed_in' | 'uaustin' | 'members';
  member_kinds: string[];
  results_visibility: 'live' | 'after_round' | 'after_close' | 'admins_only';
  is_anonymous: boolean;
  allow_change: boolean;
  feature_on_home: boolean;
  event_id: string;
  options: OptionInput[];
}

export const NEW_VOTE: VoteFormValues = {
  title: '',
  resolution: '',
  description: '',
  format: 'pre_post',
  winner_rule: 'swing',
  eligibility: 'anyone',
  member_kinds: [],
  results_visibility: 'after_round',
  is_anonymous: true,
  allow_change: true,
  feature_on_home: true,
  event_id: '',
  options: [
    { label: 'Yea', color: '#7f1f20', role: 'side' },
    { label: 'Nay', color: '#2f2e2e', role: 'side' },
    { label: 'Undecided', color: '#a0a09f', role: 'neutral' },
  ],
};

const PALETTE = [...DEFAULT_COLORS, '#2f6b3b', '#d9822b'];

function Choice({ name, value, checked, onChange, title, help }: { name: string; value: string; checked: boolean; onChange: (v: string) => void; title: string; help: string }) {
  return (
    <label className={`choice${checked ? ' is-on' : ''}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} />
      <span>
        <span className="choice__title">{title}</span>
        <span className="choice__help">{help}</span>
      </span>
    </label>
  );
}

export function VoteForm({
  voteId,
  values,
  events,
  locked,
}: {
  voteId: string | null;
  values: VoteFormValues;
  events: { id: string; title: string }[];
  locked: boolean;
}) {
  const [state, action, pending] = useActionState<VoteFormState, FormData>(saveVote.bind(null, voteId), {});
  const [format, setFormat] = useState(values.format);
  const [rule, setRule] = useState(values.winner_rule);
  const [elig, setElig] = useState(values.eligibility);
  const [vis, setVis] = useState(values.results_visibility);
  const [options, setOptions] = useState<OptionInput[]>(values.options);

  const setOpt = (i: number, patch: Partial<OptionInput>) => setOptions(options.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...options];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setOptions(next);
  };
  const effectiveRule = format === 'single' && rule === 'swing' ? 'plurality' : rule;

  return (
    <form action={action} className="vote-form">
      <input type="hidden" name="options" value={JSON.stringify(options)} />

      <section className="panel">
        <h2>The question</h2>
        <div className="ui-field">
          <label htmlFor="resolution">Motion or question</label>
          <input id="resolution" name="resolution" className="ui-input ui-input--lg" defaultValue={values.resolution} placeholder="Do the Gracchi need to die for the Republic to survive?" required />
          <span className="ui-hint">Shown large on the voting page and the projector.</span>
        </div>
        <div className="ui-row">
          <div className="ui-field">
            <label htmlFor="title">Short name</label>
            <input id="title" name="title" className="ui-input" defaultValue={values.title} placeholder="Gracchi debate" required />
            <span className="ui-hint">For the admin list{voteId ? '' : ' and the link (austinunion.org/vote/…)'}.</span>
          </div>
          <div className="ui-field">
            <label htmlFor="event_id">Event (optional)</label>
            <select id="event_id" name="event_id" className="ui-select" defaultValue={values.event_id}>
              <option value="">— None —</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="ui-field">
          <label htmlFor="description">Note for voters (optional)</label>
          <textarea id="description" name="description" className="ui-textarea" defaultValue={values.description} placeholder="E.g. a one-line summary of each side." />
        </div>
      </section>

      <section className="panel">
        <h2>Format</h2>
        <div className="choices">
          <Choice name="format" value="pre_post" checked={format === 'pre_post'} onChange={(v) => { setFormat(v as 'pre_post'); setRule('swing'); }} title="Initial and final vote" help="Vote before the debate and after it, from the same link. Best for debates." />
          <Choice name="format" value="single" checked={format === 'single'} onChange={(v) => { setFormat(v as 'single'); setRule('plurality'); }} title="Single vote" help="One round, like a straw poll." />
        </div>

        <p className="ui-label" style={{ margin: '22px 0 10px' }}>
          Options {locked && <span className="muted small">(people have voted — you can rename or recolour, not add or remove)</span>}
        </p>
        <ul className="option-editor">
          {options.map((o, i) => (
            <li key={o.id ?? `new-${i}`} style={{ borderLeftColor: o.color }}>
              <input className="ui-input" value={o.label} onChange={(e) => setOpt(i, { label: e.target.value })} aria-label={`Option ${i + 1}`} placeholder="Option" />
              <div className="swatches" role="radiogroup" aria-label="Colour">
                {PALETTE.map((c) => (
                  <button key={c} type="button" className={`swatch-pick${o.color === c ? ' is-on' : ''}`} style={{ background: c }} onClick={() => setOpt(i, { color: c })} aria-label={c} aria-checked={o.color === c} role="radio" />
                ))}
              </div>
              <label className="ui-check small" title="Neutral options (like Undecided) are counted but can't win.">
                <input type="checkbox" checked={o.role === 'neutral'} onChange={(e) => setOpt(i, { role: e.target.checked ? 'neutral' : 'side' })} disabled={locked} /> Neutral
              </label>
              <span className="option-editor__tools">
                <button type="button" className="ui-link" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                  ↑
                </button>
                <button type="button" className="ui-link" onClick={() => move(i, 1)} disabled={i === options.length - 1} aria-label="Move down">
                  ↓
                </button>
                {!locked && (
                  <button type="button" className="ui-link" onClick={() => setOptions(options.filter((_, j) => j !== i))} disabled={options.length <= 2} aria-label="Remove">
                    ✕
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
        {!locked && (
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--small" onClick={() => setOptions([...options, { label: '', color: PALETTE[options.length % PALETTE.length], role: 'side' }])}>
            + Add an option
          </button>
        )}

        <p className="ui-label" style={{ margin: '24px 0 10px' }}>
          Who wins
        </p>
        <div className="choices">
          {format === 'pre_post' && (
            <Choice name="winner_rule" value="swing" checked={effectiveRule === 'swing'} onChange={(v) => setRule(v as 'swing')} title="Biggest swing" help="The side whose share of the vote grew most from the initial to the final vote." />
          )}
          <Choice name="winner_rule" value="plurality" checked={effectiveRule === 'plurality'} onChange={(v) => setRule(v as 'plurality')} title="Most votes" help={format === 'pre_post' ? 'The side with the most votes in the final round.' : 'The side with the most votes.'} />
          <Choice name="winner_rule" value="none" checked={effectiveRule === 'none'} onChange={(v) => setRule(v as 'none')} title="No winner" help="Just show the results." />
        </div>
      </section>

      <section className="panel">
        <h2>Voting rules</h2>
        <p className="ui-label" style={{ marginBottom: 10 }}>
          Who can vote
        </p>
        <div className="choices">
          <Choice name="eligibility" value="anyone" checked={elig === 'anyone'} onChange={(v) => setElig(v as 'anyone')} title="Anyone with the link" help="One vote per phone or browser. No sign-in — best for a live room." />
          <Choice name="eligibility" value="signed_in" checked={elig === 'signed_in'} onChange={(v) => setElig(v as 'signed_in')} title="Anyone who signs in" help="One vote per person; sign-in by email code takes ~30 seconds." />
          <Choice name="eligibility" value="uaustin" checked={elig === 'uaustin'} onChange={(v) => setElig(v as 'uaustin')} title="UATX students" help="Must have a verified UATX email." />
          <Choice name="eligibility" value="members" checked={elig === 'members'} onChange={(v) => setElig(v as 'members')} title="Members only" help="Current members (choose which kinds below)." />
        </div>
        {elig === 'members' && (
          <div className="badge-list step-in" style={{ gap: 18, margin: '14px 0 0 4px' }}>
            {(['voting', 'associate', 'honorary'] as const).map((k) => (
              <label key={k} className="ui-check">
                <input type="checkbox" name="member_kinds" value={k} defaultChecked={values.member_kinds.length === 0 || values.member_kinds.includes(k)} />
                <span className={`badge badge--${k}`}>{k[0].toUpperCase() + k.slice(1)}</span>
              </label>
            ))}
          </div>
        )}

        <p className="ui-label" style={{ margin: '24px 0 10px' }}>
          When voters see results
        </p>
        <div className="choices">
          <Choice name="results_visibility" value="after_round" checked={vis === 'after_round'} onChange={(v) => setVis(v as 'after_round')} title="After each round" help="Results appear when you close a round (recommended for debates)." />
          <Choice name="results_visibility" value="live" checked={vis === 'live'} onChange={(v) => setVis(v as 'live')} title="Live" help="Bars move as votes come in." />
          <Choice name="results_visibility" value="after_close" checked={vis === 'after_close'} onChange={(v) => setVis(v as 'after_close')} title="Only at the end" help="Nothing is shown until the whole vote closes." />
          <Choice name="results_visibility" value="admins_only" checked={vis === 'admins_only'} onChange={(v) => setVis(v as 'admins_only')} title="Officers only" help="Voters never see results." />
        </div>

        <div className="toggles">
          <label className="ui-check">
            <input type="checkbox" name="is_anonymous" defaultChecked={values.is_anonymous} />
            <span>
              Secret ballot<span className="ui-hint" style={{ display: 'block' }}>Officers see totals, never who voted for what.</span>
            </span>
          </label>
          <label className="ui-check">
            <input type="checkbox" name="allow_change" defaultChecked={values.allow_change} />
            <span>
              Voters can change their vote<span className="ui-hint" style={{ display: 'block' }}>Until the round closes.</span>
            </span>
          </label>
          <label className="ui-check">
            <input type="checkbox" name="feature_on_home" defaultChecked={values.feature_on_home} />
            <span>
              Announce on the homepage while open<span className="ui-hint" style={{ display: 'block' }}>A slim “Live vote” banner under the menu.</span>
            </span>
          </label>
        </div>
      </section>

      {state.error && <p className="ui-error">{state.error}</p>}
      {state.message && <p className="ui-notice">{state.message}</p>}
      <div className="form-bar">
        <button className="ui-btn" type="submit" disabled={pending}>
          {pending ? 'Saving…' : voteId ? 'Save changes' : 'Create vote'}
        </button>
      </div>
    </form>
  );
}
