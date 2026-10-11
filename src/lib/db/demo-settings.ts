import { useSyncExternalStore } from 'react';

export type LatencyProfile = 'instant' | 'normal' | 'slow' | 'flaky';
export interface DemoSettings {
  latency: LatencyProfile;
  offline: boolean;
}

const KEY = 'tessera.demo.v1';
const defaults: DemoSettings = { latency: 'normal', offline: false };
let current: DemoSettings = defaults;
let loaded = false;
const listeners = new Set<() => void>();

function ensure() {
  if (loaded) return;
  loaded = true;
  try {
    current = { ...defaults, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<DemoSettings>) };
  } catch {
    current = defaults;
  }
}

export function getDemoSettings(): DemoSettings {
  ensure();
  return current;
}

export function setDemoSettings(patch: Partial<DemoSettings>) {
  ensure();
  current = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Storage may be blocked; the setting still applies for this session.
  }
  listeners.forEach((l) => l());
}

export function useDemoSettings(): DemoSettings {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getDemoSettings,
    () => defaults,
  );
}
