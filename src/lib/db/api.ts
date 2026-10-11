import { ApiError } from './errors';
import { getDemoSettings, type LatencyProfile } from './demo-settings';

const ranges: Record<LatencyProfile, [number, number]> = { instant: [0, 0], normal: [70, 260], slow: [900, 2400], flaky: [150, 700] };
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface CallOptions {
  /** Writes can fail in `flaky` mode; reads fail less often. */
  write?: boolean;
  /** Skips latency and failure simulation (used for boot work). */
  raw?: boolean;
}

/** Every service call goes through here, so loading, error and offline states can be exercised for real. */
export async function call<T>(fn: () => T | Promise<T>, opts: CallOptions = {}): Promise<T> {
  if (!opts.raw) {
    const s = getDemoSettings();
    if (s.offline) {
      await sleep(120);
      throw new ApiError('offline', 'You appear to be offline.');
    }
    const [lo, hi] = ranges[s.latency];
    if (hi > 0) await sleep(lo + Math.random() * (hi - lo));
    if (s.latency === 'flaky' && Math.random() < (opts.write ? 0.3 : 0.15)) throw new ApiError('unavailable', 'The service is not responding.');
  }
  const out = await fn();
  return out === undefined ? out : (structuredClone(out) as T);
}
