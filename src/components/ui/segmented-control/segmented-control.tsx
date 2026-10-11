import { ToggleGroup } from 'radix-ui';
import { cn } from '@/lib/cn';

export interface SegmentOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SegmentOption[];
  className?: string;
}

/** Single-choice switcher for sibling views (for example Pathways | Timeline | Milestones). */
export function SegmentedControl({ label, value, onValueChange, options, className }: SegmentedControlProps) {
  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value}
      onValueChange={(v) => {
        if (v) onValueChange(v);
      }}
      className={cn('inline-flex rounded-md border border-line bg-sunken p-1', className)}
    >
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          className="inline-flex min-h-9 items-center rounded-sm px-3 text-sm font-medium text-muted transition-colors motion-fast hover:text-ink data-[state=on]:bg-raised data-[state=on]:text-ink data-[state=on]:shadow-card coarse:min-h-10"
        >
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
