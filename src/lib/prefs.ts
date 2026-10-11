'use client';

import { useSyncExternalStore } from 'react';

export type ThemePref = 'system' | 'light' | 'dark';
export type MotionPref = 'system' | 'reduce';
export type ReadingSize = 'm' | 'l' | 'xl' | 's';
export interface Prefs {
  theme: ThemePref;
  motion: MotionPref;
  readingSize: ReadingSize;
  readingSpacing: 'comfortable' | 'relaxed';
}

const KEY = 'tessera.prefs.v1';
const defaults: Prefs = { theme: 'system', motion: 'system', readingSize: 'm', readingSpacing: 'comfortable' };
const scale: Record<ReadingSize, string> = { s: '1', m: '1.12', l: '1.25', xl: '1.5' };
const leading = { comfortable: '1.7', relaxed: '1.9' } as const;

let current: Prefs = defaults;
const listeners = new Set<() => void>();

function read(): Prefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<Prefs>) } : defaults;
  } catch {
    return defaults;
  }
}

export function applyPrefs(p: Prefs) {
  const root = document.documentElement;
  if (p.theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', p.theme);
  if (p.motion === 'reduce') root.setAttribute('data-motion', 'reduce');
  else root.removeAttribute('data-motion');
  root.style.setProperty('--reading-scale', scale[p.readingSize]);
  root.style.setProperty('--reading-leading', leading[p.readingSpacing]);
}

let hydrated = false;
function ensure() {
  if (!hydrated && typeof window !== 'undefined') {
    hydrated = true;
    current = read();
  }
}

export function setPrefs(patch: Partial<Prefs>) {
  ensure();
  current = { ...current, ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Storage can be blocked (private mode); the preference still applies for this session.
  }
  applyPrefs(current);
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensure();
      return current;
    },
    () => defaults,
  );
}

// Runs before first paint so there is no flash of the wrong theme.
export const prefsBootScript = `(function(){try{var p=JSON.parse(localStorage.getItem('${KEY}')||'{}');var r=document.documentElement;if(p.theme==='light'||p.theme==='dark')r.setAttribute('data-theme',p.theme);if(p.motion==='reduce')r.setAttribute('data-motion','reduce');var s={s:'1',m:'1.12',l:'1.25',xl:'1.5'}[p.readingSize||'m'];r.style.setProperty('--reading-scale',s);if(p.readingSpacing==='relaxed')r.style.setProperty('--reading-leading','1.9')}catch(e){}})();`;
