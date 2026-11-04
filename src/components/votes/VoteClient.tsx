'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition, type CSSProperties } from 'react';
import { castBallot } from '@/app/(site)/vote/actions';
import type { PublicVoteState } from '@/lib/votes/server';
import { ResultsChart } from './ResultsChart';

const POLL_MS = 2500;

/** Live voting page: polls for phase changes, casts ballots, shows results when allowed. */
export function VoteClient({ initial }: { initial: PublicVoteState }) {
  const [state, setState] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pendingOption, setPendingOption] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const busy = useRef(false);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (!document.hidden && !busy.current) {
        try {
          const res = await fetch(`/api/votes/${initial.slug}`, { cache: 'no-store' });
          if (res.ok && alive) setState(await res.json());
        } catch {
          /* offline for a moment; try again next tick */
        }
      }
      if (alive) timer = setTimeout(tick, POLL_MS);
    };
    timer = setTimeout(tick, POLL_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [initial.slug]);

  const round = state.openRound;
  const myChoice = round ? state.mine[round] : undefined;
  const canVote = round !== null && state.eligibility.ok && (state.allowChange || !myChoice);

  function vote(optionId: string) {
    if (!canVote || optionId === myChoice) return;
    setError(null);
    setPendingOption(optionId);
    busy.current = true;
    startTransition(async () => {
      const res = await castBallot(state.slug, optionId);
      busy.current = false;
      setPendingOption(null);
      if (res.state) setState(res.state);
      if (!res.ok) setError(res.error);
    });
  }

  const roundName = state.format === 'pre_post' ? (round === 2 ? 'final vote' : 'initial vote') : 'vote';
  const resultsVisible = state.results && (state.show.initial || state.show.final);

  return (
    <div className="vote-card frame">
      <div className="frame__inner">
        <div className="vote-card__status">
          <span className={`phase phase--${state.phase}`}>
            {round !== null && <i className="phase__dot" />}
            {state.phaseLabel}
          </span>
        </div>

        {round !== null && (
          <section className="step-in" key={`round-${round}`}>
            {!state.eligibility.ok ? (
              <div className="ui-notice">
                {state.eligibility.message}{' '}
                {state.eligibility.reason === 'sign_in' && (
                  <Link className="ui-link" href={`/login?next=/vote/${state.slug}`}>
                    Sign in
                  </Link>
                )}
                {state.eligibility.reason === 'uaustin' && (
                  <Link className="ui-link" href="/account">
                    Go to your account
                  </Link>
                )}
              </div>
            ) : (
              <p className="vote-card__prompt">
                {myChoice
                  ? state.allowChange
                    ? `Your ${roundName} is in. You can change it until voting closes.`
                    : `Your ${roundName} is in.`
                  : `Cast your ${roundName}:`}
              </p>
            )}
            <div className="ballot" role="group" aria-label="Options">
              {state.options.map((o) => {
                const selected = (pendingOption ?? myChoice) === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    className={`ballot__option${selected ? ' is-selected' : ''}${o.role === 'neutral' ? ' is-neutral' : ''}`}
                    style={{ '--c': o.color ?? '#7f1f20' } as CSSProperties}
                    onClick={() => vote(o.id)}
                    disabled={!canVote && !selected}
                    aria-pressed={selected}
                  >
                    <span className="ballot__label">{o.label}</span>
                    {selected && <span className="ballot__check">{pendingOption === o.id ? 'Casting…' : '✓ Your vote'}</span>}
                  </button>
                );
              })}
            </div>
            {error && <p className="ui-error">{error}</p>}
          </section>
        )}

        {round === null && !resultsVisible && (
          <p className="vote-card__prompt step-in">
            {state.phase === 'closed'
              ? 'Voting has closed. Results will be announced in the room.'
              : 'Voting is paused. Stay on this page — it will update when the next round opens.'}
          </p>
        )}

        {resultsVisible && state.results && (
          <section className="vote-card__results step-in" key={`results-${state.phase}`}>
            {round !== null && <h2 className="vote-card__h">Results so far</h2>}
            <ResultsChart results={state.results} format={state.format} show={state.show} />
          </section>
        )}
      </div>
    </div>
  );
}
