import type { ComponentPropsWithoutRef } from 'react';
import { Tabs as RadixTabs } from 'radix-ui';
import { cn } from '@/lib/cn';

export const Tabs = RadixTabs.Root;

export function TabsList({ className, ...props }: ComponentPropsWithoutRef<typeof RadixTabs.List>) {
  return <RadixTabs.List className={cn('flex gap-1 overflow-x-auto border-b border-line', className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: ComponentPropsWithoutRef<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        '-mb-px inline-flex min-h-11 items-center whitespace-nowrap border-b-2 border-transparent px-3 text-base font-medium text-muted transition-colors motion-fast hover:text-ink data-[state=active]:border-accent data-[state=active]:text-ink',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentPropsWithoutRef<typeof RadixTabs.Content>) {
  return <RadixTabs.Content className={cn('pt-4', className)} {...props} />;
}
