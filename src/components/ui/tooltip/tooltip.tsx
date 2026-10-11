import type { ReactNode } from 'react';
import { Tooltip as RadixTooltip } from 'radix-ui';

export const TooltipProvider = ({ children }: { children: ReactNode }) => (
  <RadixTooltip.Provider delayDuration={400} skipDelayDuration={200}>
    {children}
  </RadixTooltip.Provider>
);

/** Tooltips repeat a name or hint; never put essential information only here. */
export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content sideOffset={6} className="popper z-50 max-w-xs rounded-md bg-ink/90 px-2.5 py-1.5 text-sm text-bg shadow-lift backdrop-blur">
          {content}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
