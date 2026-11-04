'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { ResultsChart } from '@/components/votes/ResultsChart';
import type { VotePhase } from '@/lib/votes/server';
import type { Results } from '@/lib/votes/tally';
import { adminTally, deleteVote, resetBallots, setPhase } from './actions';

interface Step {
  to: VotePhase;
  label: string;
  help: string;
  tone?: 'primary' | 'ink';
}

function nextSteps(phase: VotePhase, format: 'single' | 'pre_post'): Step[] {
  if (format === 'single') {
    switch (phase) {
      case 'draft':
        return [{ to: 'initial_open', label: 'Open voting', help: 'The link and QR code start accepting votes.' }];
      case 'initial_open':
        return [{ to: 'closed', label: 'Close voting & show results', help: 'Stops voting and reveals results (per your visibility setting).' }];
      default:
        return [{ to: 'initial_open', label: 'Reopen voting', help: 'Accept votes again.', tone: 'ink' }];
    }
  }
  switch (phase) {
    case 'draft':
      return [{ to: 'initial_open', label: 'Open the initial vote', help: 'Before the debate begins.' }];
    case 'initial_open':
      return [{ to: 'initial_closed', label: 'Close the initial vote', help: 'Locks in the starting position and shows it.' }];
    case 'initial_closed':
      return [
        { to: 'final_open', label: 'Open the final vote', help: 'After the debate. Same link, same voters.' },
        { to: 'initial_open', label: 'Reopen the initial vote', help: 'If people arrived late.', tone: 'ink' },
      ];
    case 'final_open':
      return [{ to: 'closed', label: 'Close & announce the winner', help: 'Ends voting and shows the swing and the winner.' }];
    case 'closed':
      return [{ to: 'final_open', label: 'Reopen the final vote', help: 'If you closed it too early.', tone: 'ink' }];
  }
}

export function LiveControl({
  voteId,
  slug,
  format,
  initialPhase,
  initialResults,
  qrSvg,
  joinUrl,
}: {
  voteId: string;
  slug: string;
  format: 'single' | 'pre_post';
  initialPhase: VotePhase;
  initialResults: Results;
  qrSvg: string;
  joinUrl: string;
}) {
  const [phase, setPhaseState] = useState(initialPhase);
  const [results, setResults] = useState(initialResults);
  const [pending, start] = useTransition();

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (!document.hidden) {
        const r = await adminTally(voteId).catch(() => null);
        if (r && alive) {
          setPhaseState(r.phase);
          setResults(r.results);
        }
      }
      if (alive) timer = setTimeout(tick, 2000);
    };
    timer = setTimeout(tick, 2000);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [voteId]);

  const go = (to: VotePhase) =>
    start(async () => {
      await setPhase(voteId, to);
      setPhaseState(to);
    });

  const steps = nextSteps(phase, format);
  const show = { initial: true, final: format === 'pre_post' && (phase === 'final_open' || phase === 'closed') };

  return (
    <section className="panel live">
      <div className="live__grid">
        <div>
          <h2>Run the vote</h2>
          <ol className="stepper" aria-label="Progress">
            {(format === 'pre_post'
              ? [
                  ['initial_open', 'Initial vote'],
                  ['initial_closed', 'Initial results'],
                  ['final_open', 'Final vote'],
                  ['closed', 'Final results'],
                ]
              : [
                  ['initial_open', 'Voting'],
                  ['closed', 'Results'],
                ]
            ).map(([p, label]) => {
              const order: VotePhase[] = ['draft', 'initial_open', 'initial_closed', 'final_open', 'closed'];
              const state = order.indexOf(phase) > order.indexOf(p as VotePhase) ? 'done' : phase === p ? 'now' : 'todo';
              return (
                <li key={p} className={`stepper__step is-${state}`}>
                  {label}
                </li>
              );
            })}
          </ol>
          <div className="live__actions">
            {steps.map((s) => (
              <div key={s.to} className="live__action">
                <button type="button" className={`ui-btn ui-btn--lg${s.tone === 'ink' ? ' ui-btn--ink' : ''}`} disabled={pending} onClick={() => go(s.to)}>
                  {s.label}
                </button>
                <span className="ui-hint">{s.help}</span>
              </div>
            ))}
          </div>
          <p className="live__links">
            <Link href={`/vote/${slug}`} target="_blank" className="ui-link">
              Voting page ↗
            </Link>
            <Link href={`/vote/${slug}/present`} target="_blank" className="ui-link">
              Projector view ↗
            </Link>
          </p>
        </div>
        <div className="live__qr">
          <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <p className="small muted">{joinUrl}</p>
        </div>
      </div>

      <hr className="rule" />
      <h3>Live count (officers only)</h3>
      <ResultsChart results={results} format={format} show={show} />

      <div className="live__danger">
        {phase !== 'draft' && (
          <button type="button" className="ui-link small" disabled={pending} onClick={() => confirm('Take this vote offline (back to draft)? Ballots are kept.') && go('draft')}>
            Take offline
          </button>
        )}
        <button
          type="button"
          className="ui-link small"
          disabled={pending}
          onClick={() => confirm('Delete every ballot cast so far? This can’t be undone.') && start(async () => { await resetBallots(voteId); setResults((r) => ({ ...r, options: r.options.map((o) => ({ ...o, initial: 0, final: 0, initialShare: 0, finalShare: 0, swing: 0 })), totals: { initial: 0, final: 0 }, winner: null })); })}
        >
          Reset ballots
        </button>
        <button type="button" className="ui-link small" disabled={pending} onClick={() => confirm('Delete this vote entirely?') && start(() => deleteVote(voteId))}>
          Delete vote
        </button>
      </div>
    </section>
  );
}
