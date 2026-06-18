'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/shared/utils';

// ─── Primitives re-exported ───────────────────────────────────────────────────

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipRoot     = TooltipPrimitive.Root;
const TooltipTrigger  = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, collisionPadding = 8, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className={cn(
        // Layout
        'z-[200] max-w-xs rounded-xl border border-border/60',
        // Background + blur
        'bg-popover/95 backdrop-blur-md',
        // Text
        'px-3.5 py-2.5 text-xs leading-relaxed text-popover-foreground',
        // Shadow
        'shadow-[0_8px_24px_rgba(0,0,0,.14)]',
        // Animation
        'data-[state=delayed-open]:animate-in data-[state=closed]:animate-out',
        'data-[state=delayed-open]:fade-in-0 data-[state=closed]:fade-out-0',
        'data-[state=delayed-open]:zoom-in-95 data-[state=closed]:zoom-out-95',
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = 'TooltipContent';

// ─── Arrow ────────────────────────────────────────────────────────────────────

const TooltipArrow = () => (
  <TooltipPrimitive.Arrow className="fill-popover/95 drop-shadow-sm" width={10} height={5} />
);

// ─── InfoTooltip — the reusable helper component ──────────────────────────────
// Usage:
//   <InfoTooltip content="Explanation text here" />
//   <InfoTooltip content={<><strong>Bold</strong> text</>} side="left" />

interface InfoTooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function InfoTooltip({ content, side = 'top', className }: InfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <button
            type="button"
            tabIndex={-1}
            className={cn(
              'inline-flex items-center justify-center rounded-full text-muted-foreground/50',
              'transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              className,
            )}
            aria-label="معلومات"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} dir="rtl">
          {content}
          <TooltipArrow />
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}

// ─── LabelWithTooltip — Label + InfoTooltip in one line ──────────────────────
// Usage:
//   <LabelWithTooltip label="قبل (د)" tooltip="Explanation…" />

interface LabelWithTooltipProps {
  label: string;
  tooltip: React.ReactNode;
  className?: string;
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
}

export function LabelWithTooltip({ label, tooltip, className, tooltipSide }: LabelWithTooltipProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <InfoTooltip content={tooltip} side={tooltipSide} />
    </div>
  );
}

export { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent, TooltipArrow };
