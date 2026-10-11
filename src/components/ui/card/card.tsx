import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const card = cva('rounded-2xl border border-line bg-surface shadow-card', {
  variants: {
    padding: { none: '', sm: 'p-3', md: 'p-4 md:p-5', lg: 'p-5 md:p-7' },
    interactive: { true: 'hover-lift', false: '' },
  },
  defaultVariants: { padding: 'md', interactive: false },
});

export interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof card> {}

export function Card({ padding, interactive, className, ...props }: CardProps) {
  return <div className={cn(card({ padding, interactive }), className)} {...props} />;
}
