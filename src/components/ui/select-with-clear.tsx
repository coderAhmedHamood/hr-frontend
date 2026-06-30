'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/shared/utils';

export type SelectWithClearProps = {
  value: string;
  onValueChange: (v: string) => void;
  onClear: () => void;
  placeholder?: string;
  /** Overrides the selected item label in the trigger (e.g. custom date range text). */
  displayLabel?: string;
  children: React.ReactNode;
  className?: string;
  /** When false, hides the clear button even if a value is selected. */
  showClear?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/** Clearable filter select — placeholder when empty; × resets via `onClear`. */
export function SelectWithClear({
  value,
  onValueChange,
  onClear,
  placeholder,
  displayLabel,
  children,
  className,
  showClear = true,
  onOpenChange,
}: SelectWithClearProps) {
  const isActive = value !== '' && value !== undefined;

  return (
    <div className={cn('relative shrink-0', className)}>
      <Select value={isActive ? value : undefined} onValueChange={onValueChange} onOpenChange={onOpenChange}>
        <SelectTrigger
          dir="rtl"
          hideChevron={isActive && showClear}
          className={cn(
            'h-8 text-xs overflow-hidden',
            isActive && showClear && 'pe-7',
            'focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus:border-input',
            'data-[state=open]:ring-0 data-[state=open]:border-input',
          )}
        >
          {displayLabel ? (
            <span className="min-w-0 flex-1 truncate text-right" dir="ltr">
              {displayLabel}
            </span>
          ) : (
            <SelectValue placeholder={placeholder} className="truncate" />
          )}
        </SelectTrigger>
        <SelectContent dir="rtl">{children}</SelectContent>
      </Select>
      {isActive && showClear ? (
        <button
          type="button"
          aria-label="مسح"
          className="absolute end-2 top-1/2 z-10 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}

export type FilterSelectOption = { value: string; label: string };

export type FilterSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly FilterSelectOption[];
  placeholder: string;
  defaultValue?: string;
  className?: string;
};

/** Filter dropdown with «all» default — uses placeholder until a specific option is chosen. */
export function FilterSelect({
  value,
  onValueChange,
  options,
  placeholder,
  defaultValue = 'all',
  className,
}: FilterSelectProps) {
  const isActive = value !== defaultValue;
  const items = options.filter((o) => o.value !== defaultValue);

  return (
    <SelectWithClear
      value={isActive ? value : ''}
      onValueChange={(v) => onValueChange(v || defaultValue)}
      onClear={() => onValueChange(defaultValue)}
      placeholder={placeholder}
      showClear={isActive}
      className={cn('w-[9.25rem] max-w-[9.25rem]', className)}
    >
      {items.map((opt) => (
        <SelectItem key={opt.value} value={opt.value} className="text-xs">
          {opt.label}
        </SelectItem>
      ))}
    </SelectWithClear>
  );
}
