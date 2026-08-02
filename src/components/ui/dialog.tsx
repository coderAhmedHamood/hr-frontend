'use client';
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

/** Portal target for Select/Popover inside an open dialog (avoids clipping + scroll lock issues). */
const DialogPortalContext = React.createContext<HTMLElement | null>(null);

export function useDialogPortalContainer() {
  return React.useContext(DialogPortalContext);
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm radix-fade',
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/** Shared viewport-safe max-height so it isn't duplicated ad hoc in dialogs that don't need the full header/body/footer shell below. */
export const dialogMaxHeightClass = 'max-h-[min(90dvh,calc(100%-2rem))]';

/** Viewport-safe shell for header + scrollable body + footer (pass `className` with `p-0`). */
export const dialogShellContentClass = `flex ${dialogMaxHeightClass} w-full flex-col gap-0 overflow-visible p-0`;

export const dialogShellHeaderClass =
  'shrink-0 border-b border-border px-6 py-5 pe-12 text-right';

/** Scrollable dialog body — use inside `dialogShellContentClass` between header and footer. */
export const dialogShellBodyClass =
  'min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6';

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { hideClose?: boolean }
>(({ className, children, hideClose, ...props }, ref) => {
  const [portalEl, setPortalEl] = React.useState<HTMLElement | null>(null);

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      setPortalEl(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  return (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={setRefs}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 flex w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4',
        'max-h-[min(90dvh,calc(100%-2rem))] overflow-visible',
        'border bg-card p-6 shadow-luxe duration-200 radix-fade-zoom sm:max-w-lg sm:rounded-lg',
        className,
      )}
      {...props}
    >
      <DialogPortalContext.Provider value={portalEl}>
        {children}
      </DialogPortalContext.Provider>
      {!hideClose && (
        <DialogPrimitive.Close
          className={cn(
            'absolute end-4 top-4 z-20 rounded-sm opacity-70 ring-offset-background transition-opacity',
            'hover:bg-muted/60 hover:opacity-100',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:pointer-events-none',
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">إغلاق</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex shrink-0 flex-col space-y-1.5 text-center sm:text-right pe-10 sm:pe-12',
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain', className)}
    {...props}
  />
);
DialogBody.displayName = 'DialogBody';

/** Row footer for confirm/delete dialogs — primary action first, cancel second (RTL start). */
export const dialogConfirmFooterClass =
  'flex shrink-0 flex-row flex-wrap items-center justify-start gap-2';

/** Extra styling for form dialogs with scrollable body. */
export const dialogFormFooterClass =
  'shrink-0 border-t border-border bg-muted/20 p-4';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(dialogConfirmFooterClass, className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('pe-1 text-lg font-semibold leading-snug tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
