import { describe, expect, it } from 'vitest';
import { schedule, stateOf, type SrsState } from './srs';

const fresh: SrsState = { box: 0, easiness: 2.5, intervalDays: 0, reps: 0 };

describe('schedule', () => {
  it('first good review is due tomorrow, second in three days', () => {
    const a = schedule(fresh, 'good');
    expect(a.intervalDays).toBe(1);
    expect(schedule(a, 'good').intervalDays).toBe(3);
  });
  it('again resets repetitions and lowers easiness but never below 1.3', () => {
    let s: SrsState = { box: 3, easiness: 1.35, intervalDays: 14, reps: 3 };
    s = schedule(s, 'again');
    expect(s.reps).toBe(0);
    expect(s.intervalDays).toBe(0);
    expect(s.easiness).toBe(1.3);
  });
  it('easy grows intervals faster than good', () => {
    const base: SrsState = { box: 2, easiness: 2.5, intervalDays: 6, reps: 2 };
    expect(schedule(base, 'easy').intervalDays).toBeGreaterThan(schedule(base, 'good').intervalDays);
  });
  it('hard never schedules less than a day and keeps the card learning', () => {
    const s = schedule({ box: 1, easiness: 2.5, intervalDays: 0, reps: 1 }, 'hard');
    expect(s.intervalDays).toBeGreaterThanOrEqual(1);
    expect(stateOf(s)).toBe('learning');
  });
  it('a long interval after several reps counts as known', () => {
    expect(stateOf({ box: 5, easiness: 2.6, intervalDays: 30, reps: 5 })).toBe('known');
  });
});
