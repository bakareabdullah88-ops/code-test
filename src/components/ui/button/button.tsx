import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

export const buttonStyles = cva(
  'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-[transform,background-color,box-shadow,border-color] motion-fast active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-on-accent shadow-card hover:bg-accent-hover hover:shadow-lift',
        secondary: 'border border-line-strong bg-surface/80 text-ink shadow-card hover:bg-sunken',
        ghost: 'text-ink hover:bg-sunken',
        danger: 'bg-danger text-on-accent hover:opacity-90',
      },
      size: {
        sm: 'min-h-9 px-3 text-sm coarse:min-h-11',
        md: 'min-h-11 px-4 text-base',
        lg: 'min-h-12 px-6 text-base',
      },
      fullWidth: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', fullWidth: false },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonStyles> {
  asChild?: boolean;
  /** Keeps the label's width while showing progress. The label must say what is happening elsewhere (live region). */
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, fullWidth, asChild, loading, disabled, children, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(buttonStyles({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          <span className={cn('inline-flex items-center gap-2', loading && 'invisible')}>{children}</span>
          {loading ? <Spinner /> : null}
        </>
      )}
    </Comp>
  );
});

function Spinner() {
  return (
    <svg className="absolute size-5 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
