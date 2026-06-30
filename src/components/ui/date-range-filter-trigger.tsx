'use client';

import * as React from 'react';
import { CalendarDays, X } from 'lucide-react';
import { DateRangePicker, type DateRangeValue } from '@/components/ui/date-range-picker';
import { normalizePeriodRange } from '@/features/hr/discipline/lib/discipline-date-filter';
import { cn, formatDisplayDate } from '@/shared/utils';

export type DateRangeFilterValue = DateRangeValue;

type DateRangeFilterTriggerProps = {
  value: DateRangeFilterValue;
  onChange: (range: DateRangeFilterValue) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  allowEmpty?: boolean;
};

function formatRangeLabel(from: string, to: string): string {
  if (!from && !to) return '';
  if (from && to && from === to) return formatDisplayDate(from);
  if (from && to) return `${formatDisplayDate(from)} — ${formatDisplayDate(to)}`;
  return from ? formatDisplayDate(from) : formatDisplayDate(to);
}

/** Toolbar / form trigger that opens {@link DateRangePicker}. */
export function DateRangeFilterTrigger({
  value,
  onChange,
  placeholder = 'نطاق التاريخ',
  className,
  triggerClassName,
  allowEmpty = false,
}: DateRangeFilterTriggerProps) {
  const [open, setOpen] = React.useState(false);
  const hasFilter = Boolean(value.from || value.to);
  const label = formatRangeLabel(value.from, value.to) || placeholder;

  const handleApply = React.useCallback(
    (range: DateRangeFilterValue) => {
      if (allowEmpty && !range.from && !range.to) {
        onChange({ from: '', to: '' });
        return;
      }
      const normalized = normalizePeriodRange(range);
      if (!normalized) return;
      onChange(normalized);
    },
    [allowEmpty, onChange],
  );

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange({ from: '', to: '' });
    },
    [onChange],
  );

  return (
    <>
      <div className={cn('relative shrink-0', className)}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs transition-colors',
            hasFilter
              ? 'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10'
              : 'border-input bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground',
            triggerClassName,
          )}
          dir="ltr"
        >
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span className="max-w-[160px] truncate" dir="rtl">
            {label}
          </span>
        </button>
        {allowEmpty && hasFilter ? (
          <button
            type="button"
            aria-label="مسح التاريخ"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={handleClear}
            className="absolute -end-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        ) : null}
      </div>

      <DateRangePicker
        open={open}
        onOpenChange={setOpen}
        value={value}
        onApply={handleApply}
      />
    </>
  );
}
