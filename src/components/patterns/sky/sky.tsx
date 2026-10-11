import { useEffect } from 'react';

export type Daypart = 'morning' | 'afternoon' | 'evening';

export function daypartFor(hour: number): Daypart {
  if (hour >= 4 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

/** The Dawn to Night background: three sky layers cross-faded by local time of day, a soft glow (starlight at night) and grain to stop banding. */
export function Sky() {
  useEffect(() => {
    const set = () => { document.documentElement.dataset.daypart = daypartFor(new Date().getHours()); };
    set();
    const id = window.setInterval(set, 15 * 60_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="sky" aria-hidden="true">
      <span className="sky-morning" />
      <span className="sky-afternoon" />
      <span className="sky-evening" />
      <span className="sky-glow" />
      <span className="sky-noise" />
    </div>
  );
}
