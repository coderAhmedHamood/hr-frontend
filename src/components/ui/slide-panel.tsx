'use client';

/**
 * SlidePanel — right-side slide-over panel built on Radix Dialog.
 * This app is RTL-first (admin routes default to dir="rtl"), so the panel
 * is anchored to the physical right edge and slides in from the right.
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils';

export const SlidePanel = DialogPrimitive.Root;
export const SlidePanelTrigger = DialogPrimitive.Trigger;
export const SlidePanelClose = DialogPrimitive.Close;

function SlidePanelOverlay({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm radix-fade',
        className,
      )}
      {...props}
    />
  );
}

interface SlidePanelContentProps
  extends Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, 'title'> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  /** Override the default body padding — e.g. `p-0` when children manage their own layout/scroll. */
  bodyClassName?: string;
}

const SIZE_CLASS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-3xl',
  '3xl': 'max-w-4xl',
  '4xl': 'max-w-5xl',
  '5xl': 'max-w-6xl',
};

export function SlidePanelContent({
  className,
  children,
  size = 'md',
  title,
  description,
  footer,
  bodyClassName,
  ...props
}: SlidePanelContentProps) {
  return (
    <DialogPrimitive.Portal>
      <SlidePanelOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-card shadow-luxe',
          'border-l border-border',
          'radix-slide-right duration-300 ease-in-out',
          SIZE_CLASS[size],
          className,
        )}
        {...props}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div className="min-w-0 flex-1">
              {title && (
                <DialogPrimitive.Title className="font-display text-xl font-bold tracking-tight">
                  {title}
                </DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
        )}

        {/* Body */}
        <div className={cn('flex-1 overflow-y-auto px-6 py-5', bodyClassName)}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 border-t border-border bg-muted/20 p-4">
            {footer}
          </div>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
