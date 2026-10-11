import { forwardRef, useId, type ComponentPropsWithoutRef } from 'react';
import { Checkbox as RadixCheckbox } from 'radix-ui';
import { Check, Minus } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';

export interface CheckboxProps extends Omit<ComponentPropsWithoutRef<typeof RadixCheckbox.Root>, 'children'> {
  label: string;
  description?: string;
}

/** The whole row is the 44px hit area. */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox({ label, description, className, id, ...props }, ref) {
  const uid = useId();
  const cid = id ?? `${uid}-cb`;
  return (
    <div className={cn('flex min-h-11 items-start gap-3 py-2.5', className)}>
      <RadixCheckbox.Root
        ref={ref}
        id={cid}
        aria-describedby={description ? `${cid}-d` : undefined}
        className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-sm border border-line-strong bg-sunken text-on-accent transition-colors motion-fast hover:border-ink data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=indeterminate]:border-accent data-[state=indeterminate]:bg-accent disabled:opacity-50"
        {...props}
      >
        <RadixCheckbox.Indicator>{props.checked === 'indeterminate' ? <Minus size={16} weight="bold" /> : <Check size={16} weight="bold" />}</RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <div className="flex flex-col">
        <label htmlFor={cid} className="cursor-pointer text-base text-ink">
          {label}
        </label>
        {description ? (
          <span id={`${cid}-d`} className="text-sm text-muted">
            {description}
          </span>
        ) : null}
      </div>
    </div>
  );
});
