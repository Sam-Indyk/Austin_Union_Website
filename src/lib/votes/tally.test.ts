import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeResults, formatSwing, type TallyOption, type TallyRow } from './tally.ts';

const opts: TallyOption[] = [
  { id: 'y', label: 'Yea', color: null, role: 'side' },
  { id: 'n', label: 'Nay', color: null, role: 'side' },
  { id: 'u', label: 'Undecided', color: null, role: 'neutral' },
];
const row = (round: number, option_id: string, ballots: number): TallyRow => ({ round, option_id, ballots });
const debate = [row(1, 'y', 30), row(1, 'n', 50), row(1, 'u', 20), row(2, 'y', 45), row(2, 'n', 48), row(2, 'u', 7)];
const label = (r: ReturnType<typeof computeResults>) => (r.winner && 'label' in r.winner ? r.winner.label : null);

test('swing: the side whose share grew most wins', () => {
  const r = computeResults(opts, debate, 'pre_post', 'swing');
  assert.equal(label(r), 'Yea');
  assert.equal(formatSwing(r.options[0].swing), '+15.0 pts');
  assert.equal(formatSwing(r.options[1].swing), '−2.0 pts');
});

test('plurality on the same ballots picks the most final votes', () => {
  assert.equal(label(computeResults(opts, debate, 'pre_post', 'plurality')), 'Nay');
});

test('shares, not raw counts, decide the swing when turnout changes', () => {
  const r = computeResults(opts, [row(1, 'y', 10), row(1, 'n', 10), row(2, 'y', 12), row(2, 'n', 28)], 'pre_post', 'swing');
  assert.equal(label(r), 'Nay'); // Nay went 50% -> 70%
});

test('Undecided is counted but can never win', () => {
  const r = computeResults(opts, [row(1, 'u', 90), row(1, 'y', 6), row(1, 'n', 4)], 'single', 'plurality');
  assert.equal(label(r), 'Yea');
});

test('ties are reported as ties', () => {
  const r = computeResults(opts, [row(1, 'y', 5), row(1, 'n', 5)], 'single', 'plurality');
  assert.ok(r.winner && 'tie' in r.winner);
});

test('no winner before the deciding round has ballots', () => {
  assert.equal(computeResults(opts, debate.slice(0, 3), 'pre_post', 'swing').winner, null);
});
