// Pure vote arithmetic: shares, swing and the winner. No I/O, so it is easy to
// reason about and test.

export type VoteFormat = 'single' | 'pre_post';
export type WinnerRule = 'plurality' | 'swing' | 'none';

export interface TallyOption {
  id: string;
  label: string;
  color: string | null;
  role: 'side' | 'neutral';
}

export interface TallyRow {
  round: number;
  option_id: string;
  ballots: number;
}

export interface OptionResult {
  id: string;
  label: string;
  color: string;
  role: 'side' | 'neutral';
  initial: number;
  final: number;
  initialShare: number;
  finalShare: number;
  /** Percentage-point change from the initial to the final round. */
  swing: number;
}

export interface Results {
  options: OptionResult[];
  totals: { initial: number; final: number };
  /** Set once the deciding round has ballots. */
  winner: { id: string; label: string; margin: number; rule: WinnerRule } | { tie: true; labels: string[]; rule: WinnerRule } | null;
}

export const DEFAULT_COLORS = ['#7f1f20', '#2f2e2e', '#a0a09f', '#c9a93a', '#324158', '#401718'];

const pct = (n: number, total: number) => (total > 0 ? (n / total) * 100 : 0);

export function computeResults(options: TallyOption[], rows: TallyRow[], format: VoteFormat, rule: WinnerRule): Results {
  const count = (round: number, id: string) => rows.find((r) => r.round === round && r.option_id === id)?.ballots ?? 0;
  const totalInitial = rows.filter((r) => r.round === 1).reduce((s, r) => s + r.ballots, 0);
  const totalFinal = rows.filter((r) => r.round === 2).reduce((s, r) => s + r.ballots, 0);

  const results: OptionResult[] = options.map((o, i) => {
    const initial = count(1, o.id);
    const final = format === 'pre_post' ? count(2, o.id) : initial;
    const initialShare = pct(initial, totalInitial);
    const finalShare = format === 'pre_post' ? pct(final, totalFinal) : initialShare;
    return {
      id: o.id,
      label: o.label,
      color: o.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      role: o.role,
      initial,
      final,
      initialShare,
      finalShare,
      swing: finalShare - initialShare,
    };
  });

  const decidingTotal = format === 'pre_post' ? totalFinal : totalInitial;
  let winner: Results['winner'] = null;
  if (rule !== 'none' && decidingTotal > 0) {
    const sides = results.filter((r) => r.role === 'side');
    const score = (r: OptionResult) => (rule === 'swing' ? r.swing : r.final);
    const best = Math.max(...sides.map(score));
    const leaders = sides.filter((r) => Math.abs(score(r) - best) < 1e-9);
    if (leaders.length === 1 && (rule !== 'swing' || best > 0)) {
      const runnerUp = Math.max(...sides.filter((r) => r !== leaders[0]).map(score), rule === 'swing' ? 0 : 0);
      winner = { id: leaders[0].id, label: leaders[0].label, margin: best - runnerUp, rule };
    } else if (leaders.length > 1 || best <= 0) {
      winner = { tie: true, labels: leaders.map((l) => l.label), rule };
    }
  }

  return { options: results, totals: { initial: totalInitial, final: format === 'pre_post' ? totalFinal : totalInitial }, winner };
}

/** "+15.2 pts" / "−3.0 pts" */
export function formatSwing(points: number): string {
  const sign = points > 0.05 ? '+' : points < -0.05 ? '−' : '±';
  return `${sign}${Math.abs(points).toFixed(1)} pts`;
}
