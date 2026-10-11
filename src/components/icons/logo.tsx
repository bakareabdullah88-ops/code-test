import type { SVGProps } from 'react';
import { brand } from '@/config/brand';

/** The tessera tile with a thread through it: the journey made small. */
export function LogoMark({ size = 28, ...props }: { size?: number } & Omit<SVGProps<SVGSVGElement>, 'width' | 'height'>) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable={false} {...props}>
      <rect x="5" y="5" width="22" height="22" rx="5" transform="rotate(8 16 16)" fill="var(--accent)" />
      <path d="M2 21c6 0 7-10 14-10s8 10 14 10" stroke="var(--bg)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="inline-flex items-center gap-2">
        <LogoMark />
        <span className="font-serif text-lg font-semibold tracking-tight">{brand.appName}</span>
      </span>
    </span>
  );
}
