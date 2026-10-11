import type { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badge = cva('inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2 py-0.5 text-xs font-medium', {
  variants: {
    tone: {
      neutral: 'bg-sunken text-muted',
      accent: 'bg-accent-soft text-accent-soft-ink',
      success: 'bg-success-soft text-success',
      warning: 'bg-warning-soft text-warning',
      danger: 'bg-danger-soft text-danger',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badge> {
  /** Status is never colour-only: pass an icon or make sure the text says it. */
  icon?: ReactNode;
}

export function Badge({ tone, icon, className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badge({ tone }), className)} {...props}>
      {icon ? <span aria-hidden="true" className="inline-flex">{icon}</span> : null}
      {children}
    </span>
  );
}
