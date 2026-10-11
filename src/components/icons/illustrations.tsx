import type { SVGProps } from 'react';

/* Original spot illustrations: two inks only (text + accent), drawn on a 120x96 grid. */
type Props = SVGProps<SVGSVGElement>;

const base = {
  viewBox: '0 0 120 96',
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

export function BookIllustration(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M60 22c-9-6-22-8-38-6v54c16-2 29 0 38 6 9-6 22-8 38-6V16c-16-2-29 0-38 6Z" stroke="var(--text)" />
      <path d="M60 22v54" stroke="var(--text)" />
      <path d="M31 30c7-1 14 0 21 3M31 40c7-1 14 0 21 3M31 50c7-1 14 0 21 3" stroke="var(--text-subtle)" />
      <path d="M69 33c7-3 14-4 21-3" stroke="var(--accent)" />
      <path d="M69 43c7-3 14-4 21-3" stroke="var(--accent)" />
      <rect x="82" y="58" width="9" height="9" rx="2" transform="rotate(8 86 62)" fill="var(--accent)" stroke="var(--accent)" />
    </svg>
  );
}

export function LampIllustration(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M40 66c0-12 8-20 20-20s20 8 20 20c0 6-4 10-10 10H50c-6 0-10-4-10-10Z" stroke="var(--text)" />
      <path d="M40 66h-8c-2 0-3-2-2-4l6-8M80 66h6" stroke="var(--text)" />
      <path d="M60 46c-3-5 0-10 5-14 1 5 4 7 4 12" stroke="var(--accent)" />
      <path d="M60 14v8M42 22l5 5M78 22l-5 5" stroke="var(--accent)" />
      <path d="M44 84h32" stroke="var(--text-subtle)" />
    </svg>
  );
}

export function PathIllustration(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M14 78c18 0 14-26 32-26s14 22 32 22 16-34 28-34" stroke="var(--text-subtle)" strokeDasharray="1 7" />
      <rect x="9" y="72" width="12" height="12" rx="2" transform="rotate(-8 15 78)" stroke="var(--text)" />
      <rect x="40" y="46" width="12" height="12" rx="2" transform="rotate(7 46 52)" stroke="var(--text)" />
      <rect x="72" y="68" width="12" height="12" rx="2" transform="rotate(-6 78 74)" stroke="var(--text)" />
      <rect x="100" y="34" width="14" height="14" rx="2" transform="rotate(8 107 41)" fill="var(--accent)" stroke="var(--accent)" />
    </svg>
  );
}

export function CloudOffIllustration(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M36 70h46a16 16 0 0 0 2-31.8A22 22 0 0 0 42 34a18 18 0 0 0-6 36Z" stroke="var(--text)" />
      <path d="M30 20l60 60" stroke="var(--accent)" />
    </svg>
  );
}
