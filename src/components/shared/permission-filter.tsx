'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFilterPermission } from '@/features/auth/permissions/use-filter-permission';
import { cn } from '@/shared/utils';

export type PermissionFilterOption = { value: string; label: string };

export type PermissionFilterProps = {
  /** Permission code required to use this filter (e.g. `hr.organization.branches.read`). */
  permission: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly PermissionFilterOption[];
  placeholder?: string;
  /** Label shown in the trigger when the user lacks permission (defaults to the first option's label, usually "الكل"). */
  disabledLabel?: string;
  className?: string;
  triggerClassName?: string;
};

/**
 * Filter control gated by a permission code. Missing permission never blocks
 * the page — it only renders the trigger as a disabled/read-only value and
 * warns via toast on interaction. Never throws.
 */
export function PermissionFilter({
  permission,
  label,
  value,
  onChange,
  options,
  placeholder,
  disabledLabel,
  className,
  triggerClassName,
}: PermissionFilterProps) {
  const { allowed, notifyDenied } = useFilterPermission(permission);

  if (!allowed) {
    const fallbackLabel = disabledLabel ?? options[0]?.label ?? placeholder ?? '—';
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {label ? <span className="text-xs text-muted-foreground">{label}</span> : null}
        <button
          type="button"
          onClick={notifyDenied}
          className={cn(
            'flex h-11 w-full items-center justify-between rounded-md border border-input bg-muted/40 px-4 py-2 text-sm text-right text-muted-foreground',
            triggerClassName,
          )}
        >
          {fallbackLabel}
        </button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label ? <span className="text-xs text-muted-foreground">{label}</span> : null}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
