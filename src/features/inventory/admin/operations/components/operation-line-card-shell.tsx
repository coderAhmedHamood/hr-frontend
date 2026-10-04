'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/shared/utils';

type OperationLineCardShellProps = {
  index: number;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  onRemove?: () => void;
  removeDisabled?: boolean;
  className?: string;
};

export function OperationLineCardShell({
  index,
  title,
  subtitle,
  children,
  onRemove,
  removeDisabled,
  className,
}: OperationLineCardShellProps) {
  return (
    <article
      className={cn(
        'rounded-2xl border border-border/80 bg-card p-4 shadow-soft sm:p-5',
        className,
      )}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-border/60 pb-3">
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs font-medium text-muted-foreground">سطر {index + 1}</p>
          {title ? <p className="truncate text-sm font-semibold text-foreground">{title}</p> : null}
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground" dir="ltr">
              {subtitle}
            </p>
          ) : null}
        </div>
        {onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={removeDisabled}
            aria-label="حذف السطر"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </article>
  );
}

type OperationLineFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function OperationLineField({
  label,
  htmlFor,
  hint,
  fullWidth,
  children,
  className,
}: OperationLineFieldProps) {
  return (
    <div
      className={cn(
        'space-y-1.5',
        fullWidth && 'sm:col-span-2 lg:col-span-3',
        className,
      )}
    >
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function OperationLinesStack({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('flex flex-col gap-4', className)}>{children}</div>;
}
