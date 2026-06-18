'use client';

/**
 * SlidePanel — right-side slide-over panel built on Radix Dialog.
 * RTL-aware: slides in from the left in RTL contexts.
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

interface SlidePanelContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  title?: string;
  description?: string;
  footer?: React.ReactNode;
}

const SIZE_CLASS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function SlidePanelContent({
  className,
  children,
  size = 'md',
  title,
  description,
  footer,
  ...props
}: SlidePanelContentProps) {
  return (
    <DialogPrimitive.Portal>
      <SlidePanelOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-full flex-col bg-card shadow-luxe',
          'border-r border-border',
          'radix-slide-left duration-300 ease-in-out',
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
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 border-t border-border bg-muted/20 px-6 py-4">
            {footer}
          </div>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
