import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Check } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> {
  selected?: boolean;
}

/** Toggleable filter chip. Selected state shows a check as well as colour. */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip({ selected = false, className, children, type, ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      aria-pressed={selected}
      className={cn(
        'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors motion-fast',
        selected ? 'border-accent bg-accent-soft text-accent-soft-ink' : 'border-line-strong bg-surface text-ink hover:bg-sunken',
        className,
      )}
      {...props}
    >
      {selected ? <Check size={14} weight="bold" aria-hidden="true" /> : null}
      {children}
    </button>
  );
});
