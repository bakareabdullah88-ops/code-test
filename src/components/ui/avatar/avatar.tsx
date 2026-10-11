import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/** Initials from the first and last word of a name. Works for single names and non-Latin scripts. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) return '?';
  const first = Array.from(words[0] ?? '')[0] ?? '';
  const last = words.length > 1 ? (Array.from(words[words.length - 1] ?? '')[0] ?? '') : '';
  return (first + last).toLocaleUpperCase();
}

/** Deterministic tint index (1-6) so a person always gets the same colour. */
export function tintOf(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return (h % 6) + 1;
}

const tints = ['bg-tint-1', 'bg-tint-2', 'bg-tint-3', 'bg-tint-4', 'bg-tint-5', 'bg-tint-6'] as const;

const avatar = cva('inline-flex shrink-0 select-none items-center justify-center rounded-md font-semibold text-ink', {
  variants: { size: { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg' } },
  defaultVariants: { size: 'md' },
});

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  src?: string | null;
  className?: string;
}

/** Monogram tile; the name is the accessible label so it never needs alt text. */
export function Avatar({ name, size, src, className }: AvatarProps) {
  if (src) {
    return <img src={src} alt={name} className={cn(avatar({ size }), 'object-cover', className)} />;
  }
  const tint = tints[tintOf(name) - 1];
  return (
    <span role="img" aria-label={name} className={cn(avatar({ size }), tint, className)}>
      <span aria-hidden="true">{initialsOf(name)}</span>
    </span>
  );
}
