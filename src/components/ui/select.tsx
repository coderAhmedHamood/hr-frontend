'use client';
import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useDialogPortalContainer } from '@/components/ui/dialog';
import { cn } from '@/shared/utils';

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { hideChevron?: boolean }
>(({ className, children, hideChevron, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    dir="rtl"
    className={cn(
      'flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm text-right ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 [&>span]:flex-1 [&>span]:text-right',
      className,
    )}
    {...props}
  >
    {children}
    {!hideChevron && (
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    )}
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export type SelectContentProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
  container?: HTMLElement | DocumentFragment | null;
};

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(({ className, children, position = 'popper', align = 'center', sideOffset = 4, collisionPadding = 16, container, ...props }, ref) => {
  const dialogContainer = useDialogPortalContainer();
  const portalContainer = container ?? dialogContainer ?? undefined;

  return (
  <SelectPrimitive.Portal container={portalContainer}>
    <SelectPrimitive.Content
      ref={ref}
      dir="rtl"
      className={cn(
        'relative z-[200] max-h-96 min-w-[8rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border bg-popover text-right text-popover-foreground shadow-elevated radix-fade-zoom',
        className,
      )}
      position={position}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      {...props}
    >
      <SelectPrimitive.Viewport className={cn('p-1', position === 'popper' && 'select-match-trigger')}>
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 ps-8 pe-2 text-right text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_[data-radix-select-item-text]]:min-w-0 [&_[data-radix-select-item-text]]:flex-1',
      className,
    )}
    {...props}
  >
    <span className="absolute start-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem };
