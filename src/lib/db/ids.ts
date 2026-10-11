import type { Id } from '@/types';

export function newId<K extends string>(prefix: K): Id<K> {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().replace(/-/g, '').slice(0, 14) : Math.random().toString(36).slice(2, 16);
  return `${prefix}_${rand}` as Id<K>;
}

export const nowIso = () => new Date().toISOString();
export const daysAgo = (d: number, hour = 9) => {
  const t = new Date();
  t.setUTCHours(hour, 0, 0, 0);
  return new Date(t.getTime() - d * 86_400_000).toISOString();
};
export const daysFromNow = (d: number, hour = 9) => daysAgo(-d, hour);
