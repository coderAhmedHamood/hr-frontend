'use client';
import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/shared/utils';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center overflow-hidden rounded-full border border-border/60 bg-muted/70 p-0.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)] transition duration-200 ease-out',
      'outline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
      'data-[state=checked]:border-primary/45 data-[state=checked]:bg-primary data-[state=checked]:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_10px_-3px_hsl(var(--primary)/0.45)]',
      'data-[state=unchecked]:bg-muted/80 dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)]',
      className,
    )}
    {...props}
    dir="ltr"
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full border border-black/[0.06] bg-background shadow-md ring-0 transition-transform duration-200 ease-[cubic-bezier(0.33,1,0.68,1)]',
        'dark:border-white/12 dark:bg-zinc-50',
        'data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-5',
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
