'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Ornament } from '@/components/Ornament';
import type { PublicVoteState } from '@/lib/votes/server';
import { ResultsChart } from './ResultsChart';

const POLL_MS = 1500;

/** Projector view: QR code + live turnout while voting, the chart when results are public. */
export function PresentClient({ initial, qrSvg, joinUrl }: { initial: PublicVoteState; qrSvg: string; joinUrl: string }) {
  const [state, setState] = useState(initial);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const res = await fetch(`/api/votes/${initial.slug}`, { cache: 'no-store' });
        if (res.ok && alive) setState(await res.json());
      } catch {
        /* keep the last good state on screen */
      }
      if (alive) timer = setTimeout(tick, POLL_MS);
    };
    timer = setTimeout(tick, POLL_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [initial.slug]);

  const open = state.openRound !== null;
  const turnout = state.openRound === 2 ? state.turnout.final : state.turnout.initial;
  const resultsVisible = Boolean(state.results) && (state.show.initial || state.show.final);

  return (
    <div className={`present${resultsVisible && !open ? ' present--results' : ''}`}>
      <header className="present__head">
        <Image src="/media/site/seal.png" alt="" width={84} height={84} className="present__seal" />
        <p className="present__kicker">
          <Ornament name="scroll" /> The Austin Union Votes <Ornament name="scroll" className="ornament--flip" />
        </p>
        <h1 className="present__title">{state.resolution}</h1>
        <p className={`phase phase--${state.phase} phase--big`}>
          {open && <i className="phase__dot" />}
          {state.phaseLabel}
        </p>
      </header>

      <main className="present__body">
        {open && (
          <section className="present__join step-in" key={`join-${state.phase}`}>
            <div className="present__qr" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <div className="present__joininfo">
              <p className="present__scan">Scan to vote</p>
              <p className="present__url">{joinUrl}</p>
              <p className="present__count">
                <span key={turnout} className="present__countnum">
                  {turnout}
                </span>
                {turnout === 1 ? ' vote cast' : ' votes cast'}
              </p>
              <ul className="present__options">
                {state.options.map((o) => (
                  <li key={o.id} style={{ borderColor: o.color ?? '#7f1f20' }}>
                    {o.label}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {resultsVisible && state.results && (
          <section className={`present__results step-in${open ? ' present__results--side' : ''}`} key={`res-${state.phase}`}>
            <ResultsChart results={state.results} format={state.format} show={state.show} size="large" />
          </section>
        )}

        {!open && !resultsVisible && (
          <p className="present__wait step-in">
            {state.phase === 'closed' ? 'Voting has closed.' : 'The next round will open shortly.'}
          </p>
        )}
      </main>
    </div>
  );
}
