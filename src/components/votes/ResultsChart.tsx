'use client';

import type { CSSProperties } from 'react';
import { Ornament } from '@/components/Ornament';
import { formatSwing, type Results } from '@/lib/votes/tally';

interface Props {
  results: Results;
  format: 'single' | 'pre_post';
  show: { initial: boolean; final: boolean };
  size?: 'normal' | 'large';
}

const pctLabel = (n: number) => `${Math.round(n)}%`;

function verdictLine(results: Results, winnerId: string): string {
  const w = results.options.find((o) => o.id === winnerId)!;
  if (results.winner && 'rule' in results.winner && results.winner.rule === 'swing') {
    return `Swung ${formatSwing(w.swing).replace(' pts', ' points')} · ${Math.round(w.initialShare)}% → ${Math.round(w.finalShare)}%`;
  }
  return `${w.final} of ${results.totals.final} votes`;
}

/** Animated horizontal bars; for debate votes, "before" and "after" bars with the swing. */
export function ResultsChart({ results, format, show, size = 'normal' }: Props) {
  const twoRounds = format === 'pre_post';
  const showFinal = twoRounds ? show.final : show.initial;
  const max = Math.max(1, ...results.options.flatMap((o) => [o.initialShare, twoRounds && show.final ? o.finalShare : 0]));
  // Scale bars to the leader so small rooms still read clearly, but never past 100%.
  const widthOf = (share: number) => Math.min(100, (share / Math.max(max, 50)) * 100);
  const scale = (share: number) => `${widthOf(share)}%`;
  // Counts sit at the right end of the bar; switch to light text once the fill reaches them.
  const onFill = (share: number) => (widthOf(share) > 78 ? 'on-fill' : undefined);

  return (
    <div className={`results results--${size}`}>
      {twoRounds && (
        <div className="results__legend" aria-hidden="true">
          <span>
            <i className="swatch swatch--initial" /> Initial vote
          </span>
          {show.final && (
            <span>
              <i className="swatch swatch--final" /> Final vote
            </span>
          )}
        </div>
      )}
      <ul className="results__list">
        {results.options.map((o) => {
          const isWinner = results.winner && 'id' in results.winner && results.winner.id === o.id && showFinal;
          return (
            <li key={o.id} className={`results__row${isWinner ? ' is-winner' : ''}`} style={{ '--c': o.color } as CSSProperties}>
              <div className="results__head">
                <span className="results__label">{o.label}</span>
                <span className="results__pct">
                  {twoRounds && show.final ? pctLabel(o.finalShare) : pctLabel(o.initialShare)}
                  {twoRounds && show.final && o.role === 'side' && (
                    <span className={`swing ${o.swing > 0.05 ? 'swing--up' : o.swing < -0.05 ? 'swing--down' : ''}`}>{formatSwing(o.swing)}</span>
                  )}
                </span>
              </div>
              {twoRounds ? (
                <>
                  <div className="bar bar--initial" title={`Initial: ${o.initial} (${pctLabel(o.initialShare)})`}>
                    <span style={{ width: scale(o.initialShare) }} />
                    <em className={onFill(o.initialShare)}>{show.final ? `${pctLabel(o.initialShare)} before` : `${o.initial} votes`}</em>
                  </div>
                  {show.final && (
                    <div className="bar bar--final" title={`Final: ${o.final} (${pctLabel(o.finalShare)})`}>
                      <span style={{ width: scale(o.finalShare) }} />
                      <em className={onFill(o.finalShare)}>{o.final} votes</em>
                    </div>
                  )}
                </>
              ) : (
                <div className="bar bar--final">
                  <span style={{ width: scale(o.initialShare) }} />
                  <em className={onFill(o.initialShare)}>{o.initial} votes</em>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="results__total">
        {twoRounds
          ? `${results.totals.initial} initial vote${results.totals.initial === 1 ? '' : 's'}${show.final ? ` · ${results.totals.final} final vote${results.totals.final === 1 ? '' : 's'}` : ''}`
          : `${results.totals.initial} vote${results.totals.initial === 1 ? '' : 's'}`}
      </p>
      {showFinal && results.winner && (
        <div className="verdict" role="status">
          <Ornament name="flourish" className="verdict__orn" />
          {'id' in results.winner ? (
            <div>
              <p className="verdict__title">{results.winner.label} carries the house</p>
              <p className="verdict__sub">{verdictLine(results, results.winner.id)}</p>
            </div>
          ) : (
            <div>
              <p className="verdict__title">The house is divided</p>
              <p className="verdict__sub">A tie between {results.winner.labels.join(' and ') || 'the sides'}</p>
            </div>
          )}
          <Ornament name="flourish" className="verdict__orn" />
        </div>
      )}
    </div>
  );
}
