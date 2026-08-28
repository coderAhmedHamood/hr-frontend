'use client';

import * as React from 'react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDisplayDate, getDisplayDateTimeParts } from '@/shared/utils';
import {
  RowActions,
  type RowMenuItem,
  type RowPrimaryAction,
} from '@/components/ui/row-actions';

/** Standard date/datetime display — use in tables, dialogs, cards, anywhere. */
export function TableDateCell({
  value,
  mode = 'date',
  className,
}: {
  value: string | Date | null | undefined;
  mode?: 'date' | 'datetime';
  className?: string;
}) {
  const baseClass = className ?? 'font-mono text-xs tabular-nums text-muted-foreground whitespace-nowrap';

  if (mode === 'datetime') {
    const parts = getDisplayDateTimeParts(value);
    if (!parts) {
      return <span className={baseClass}>—</span>;
    }
    return (
      <span className={baseClass} dir="rtl">
        <span dir="ltr">{parts.date}</span>
        <span>-</span>
        <span dir="ltr">{parts.hours}:{parts.minutes}{parts.period}</span>
      </span>
    );
  }

  return (
    <span className={baseClass} dir="ltr">
      {formatDisplayDate(value)}
    </span>
  );
}

/** Alias for use outside DataTable. */
export const DisplayDate = TableDateCell;

/** Unified primary + dropdown actions for table rows. */
export function TableRowActions({
  primaryActions,
  menuItems = [],
  className,
}: {
  primaryActions?: RowPrimaryAction[];
  menuItems?: RowMenuItem[];
  className?: string;
}) {
  return (
    <RowActions
      primaryActions={primaryActions}
      menuItems={menuItems}
      className={className}
    />
  );
}

/** Simple read-only detail dialog opened by row click. */
export function TableRowDetailDialog({
  open,
  onOpenChange,
  title,
  fields,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: { label: string; value: React.ReactNode }[];
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden" dir="rtl">
        <DialogHeader className="pb-3">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody className="min-h-0 space-y-4 pe-1">
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.label} className="min-w-0">
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <div className="mt-0.5 text-sm font-medium break-words">{f.value}</div>
              </div>
            ))}
          </div>
          {children ? <div className="border-t border-border/60 pt-4">{children}</div> : null}
        </DialogBody>
        {footer ? (
          <DialogFooter className={dialogFormFooterClass}>
            {footer}
            <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
