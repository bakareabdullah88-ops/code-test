import { cn } from '@/lib/cn';

/* Original generative cover art. Layers of tone from the design tokens, so covers follow theme and accent. */
const sky = 'color-mix(in srgb, var(--accent) 14%, var(--surface-sunken))';
const hillFar = 'color-mix(in srgb, var(--accent) 28%, var(--surface-sunken))';
const hillMid = 'color-mix(in srgb, var(--accent) 52%, var(--surface-sunken))';
const hillNear = 'color-mix(in srgb, var(--accent) 78%, var(--text))';
const ink = 'var(--text)';

function Dawn() {
  return (
    <>
      <rect width="400" height="240" fill={sky} />
      <g className="float-slow"><circle cx="270" cy="128" r="46" fill="var(--accent)" opacity="0.92" /><circle cx="270" cy="128" r="70" fill="var(--accent)" opacity="0.14" /><circle cx="270" cy="128" r="104" fill="var(--accent)" opacity="0.07" /></g>
      <g className="drift" opacity="0.55"><ellipse cx="90" cy="64" rx="46" ry="9" fill="var(--surface-raised)" /><ellipse cx="130" cy="74" rx="34" ry="7" fill="var(--surface-raised)" /><ellipse cx="330" cy="40" rx="40" ry="8" fill="var(--surface-raised)" /></g>
      <path d="M0 150 C70 120 120 135 190 150 S320 140 400 126 V240 H0Z" fill={hillFar} />
      <path d="M0 176 C80 150 150 180 230 168 S350 156 400 170 V240 H0Z" fill={hillMid} />
      <path d="M0 208 C90 190 160 212 250 204 S360 192 400 206 V240 H0Z" fill={hillNear} />
    </>
  );
}
function Lamp() {
  return (
    <>
      <rect width="400" height="240" fill={`color-mix(in srgb, ${ink} 88%, var(--accent))`} />
      <g className="float-slow"><circle cx="200" cy="112" r="120" fill="var(--accent)" opacity="0.08" /><circle cx="200" cy="112" r="96" fill="var(--accent)" opacity="0.14" /><circle cx="200" cy="112" r="56" fill="var(--accent)" opacity="0.2" /></g>
      <path className="float-slow" d="M200 70 C184 98 186 116 200 126 C214 116 216 98 200 70Z" fill="var(--accent)" />
      <rect x="168" y="128" width="64" height="40" rx="10" fill={`color-mix(in srgb, var(--accent) 60%, ${ink})`} />
      <rect x="150" y="168" width="100" height="10" rx="5" fill={`color-mix(in srgb, var(--accent) 40%, ${ink})`} />
      <rect y="196" width="400" height="44" fill={`color-mix(in srgb, ${ink} 94%, var(--accent))`} />
    </>
  );
}
function Path() {
  return (
    <>
      <rect width="400" height="240" fill={sky} />
      <g className="float-slow"><circle cx="300" cy="70" r="22" fill="var(--accent)" opacity="0.9" /><circle cx="300" cy="70" r="42" fill="var(--accent)" opacity="0.14" /></g>
      <g className="drift" opacity="0.5"><ellipse cx="80" cy="50" rx="44" ry="8" fill="var(--surface-raised)" /><ellipse cx="190" cy="34" rx="32" ry="6" fill="var(--surface-raised)" /></g>
      <path d="M0 120 C60 96 140 112 220 100 S340 90 400 104 V240 H0Z" fill={hillFar} />
      <path d="M0 150 C80 128 170 150 260 138 S360 128 400 140 V240 H0Z" fill={hillMid} />
      <path d="M170 240 C186 206 198 184 214 160 C226 142 238 130 262 120" stroke={hillNear} strokeWidth="26" strokeLinecap="round" fill="none" />
      <path d="M170 240 C186 206 198 184 214 160 C226 142 238 130 262 120" stroke={sky} strokeWidth="3" strokeLinecap="round" strokeDasharray="2 14" fill="none" />
      <rect x="248" y="104" width="10" height="10" rx="2" transform="rotate(8 253 109)" fill="var(--accent)" />
    </>
  );
}
function Table() {
  return (
    <>
      <rect width="400" height="240" fill={sky} />
      <rect x="0" y="150" width="400" height="90" fill={hillMid} />
      <rect x="40" y="144" width="320" height="14" rx="4" fill={hillNear} />
      <ellipse cx="140" cy="140" rx="40" ry="9" fill="var(--surface-raised)" opacity="0.9" />
      <path d="M104 134 C110 106 170 106 176 134Z" fill="var(--accent)" opacity="0.9" />
      <ellipse cx="270" cy="140" rx="34" ry="8" fill="var(--surface-raised)" opacity="0.9" />
      <path d="M240 134 C246 112 294 112 300 134Z" fill={hillFar} />
      <circle cx="340" cy="60" r="26" fill="var(--accent)" opacity="0.18" />
    </>
  );
}
const art = { dawn: Dawn, lamp: Lamp, path: Path, table: Table } as const;

export function Cover({ coverKey, className }: { coverKey: string; className?: string }) {
  const Art = art[coverKey as keyof typeof art] ?? Dawn;
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" className={cn('block h-full w-full', className)}>
      <Art />
    </svg>
  );
}
export const coverKeys = Object.keys(art);
