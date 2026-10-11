import { forwardRef, useId, type ComponentPropsWithoutRef } from 'react';
import { RadioGroup as RadixRadioGroup } from 'radix-ui';
import { cn } from '@/lib/cn';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps extends Omit<ComponentPropsWithoutRef<typeof RadixRadioGroup.Root>, 'children'> {
  options: RadioOption[];
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup({ options, className, ...props }, ref) {
  const uid = useId();
  return (
    <RadixRadioGroup.Root ref={ref} className={cn('flex flex-col', className)} {...props}>
      {options.map((o) => {
        const id = `${uid}-${o.value}`;
        return (
          <div key={o.value} className="flex min-h-11 items-start gap-3 py-2.5">
            <RadixRadioGroup.Item
              id={id}
              value={o.value}
              aria-describedby={o.description ? `${id}-d` : undefined}
              className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-line-strong bg-sunken transition-colors motion-fast hover:border-ink data-[state=checked]:border-accent"
            >
              <RadixRadioGroup.Indicator className="block size-3 rounded-full bg-accent" />
            </RadixRadioGroup.Item>
            <div className="flex flex-col">
              <label htmlFor={id} className="cursor-pointer text-base text-ink">
                {o.label}
              </label>
              {o.description ? (
                <span id={`${id}-d`} className="text-sm text-muted">
                  {o.description}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </RadixRadioGroup.Root>
  );
});
