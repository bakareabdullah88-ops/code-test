import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const iconButtonStyles = cva(
  'inline-flex shrink-0 items-center justify-center rounded-full transition-colors motion-fast disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        ghost: 'text-muted hover:bg-sunken hover:text-ink',
        secondary: 'border border-line-strong bg-surface text-ink hover:bg-sunken',
        accent: 'bg-accent-soft text-accent-soft-ink hover:bg-sunken',
      },
      size: { sm: 'size-9 coarse:size-11', md: 'size-11' },
    },
    defaultVariants: { variant: 'ghost', size: 'md' },
  },
);

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'>,
    VariantProps<typeof iconButtonStyles> {
  /** Required: icon-only controls must have an accessible name. */
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, className, variant, size, type, children, ...props },
  ref,
) {
  return (
    <button ref={ref} type={type ?? 'button'} aria-label={label} className={cn(iconButtonStyles({ variant, size }), className)} {...props}>
      <span aria-hidden="true" className="inline-flex">
        {children}
      </span>
    </button>
  );
});
