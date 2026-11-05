import assert from 'node:assert/strict';
import { test } from 'node:test';
import { austinToISO, isoToAustin } from './time.ts';

test('central standard time (November)', () => {
  assert.equal(austinToISO('2026-11-05', '18:00'), '2026-11-06T00:00:00.000Z');
});

test('central daylight time (September)', () => {
  assert.equal(austinToISO('2026-09-27', '18:00'), '2026-09-27T23:00:00.000Z');
});

test('round-trips through the form fields', () => {
  for (const [d, t] of [
    ['2026-03-08', '09:30'],
    ['2026-11-01', '14:15'],
    ['2027-01-15', '00:05'],
  ]) {
    assert.deepEqual(isoToAustin(austinToISO(d, t)), { date: d, time: t });
  }
});
