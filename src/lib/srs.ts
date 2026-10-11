export type Rating = 'again' | 'hard' | 'good' | 'easy';
export interface SrsState { box: number; easiness: number; intervalDays: number; reps: number }

/** SM-2 style scheduling. Returns the next state; the caller turns intervalDays into a due date. */
export function schedule(prev: SrsState, rating: Rating): SrsState {
  let { easiness, intervalDays, reps } = prev;
  if (rating === 'again') {
    reps = 0;
    intervalDays = 0;
    easiness = Math.max(1.3, easiness - 0.2);
  } else if (rating === 'hard') {
    reps += 1;
    intervalDays = Math.max(1, Math.round(Math.max(1, intervalDays) * 1.2));
    easiness = Math.max(1.3, easiness - 0.15);
  } else if (rating === 'good') {
    intervalDays = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(intervalDays * easiness);
    reps += 1;
  } else {
    intervalDays = reps === 0 ? 3 : Math.round(Math.max(1, intervalDays) * easiness * 1.3);
    reps += 1;
    easiness += 0.15;
  }
  return { box: Math.min(5, reps), easiness: Number(easiness.toFixed(2)), intervalDays, reps };
}

export function stateOf(s: SrsState): 'new' | 'learning' | 'known' {
  if (s.reps === 0) return 'new';
  return s.reps >= 4 && s.intervalDays >= 21 ? 'known' : 'learning';
}
