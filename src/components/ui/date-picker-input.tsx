'use client';

import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import type { Matcher } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/shared/utils';

/** Convert YYYY-MM-DD → Date (local midnight). Returns undefined for empty / invalid. */
function ymdToDate(ymd: string): Date | undefined {
  if (!ymd) return undefined;
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

/** Convert Date → YYYY-MM-DD string. */
function dateToYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(d: Date | undefined): string {
  if (!d) return '';
  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export interface DatePickerInputProps {
  /** Value as YYYY-MM-DD string */
  value: string;
  /** Called with YYYY-MM-DD string when a date is selected */
  onChange: (ymd: string) => void;
  placeholder?: string;
  /** Minimum selectable date as YYYY-MM-DD */
  minDate?: string;
  /** Maximum selectable date as YYYY-MM-DD */
  maxDate?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  /**
   * When used inside a Radix Dialog, pass the dialog content element so the calendar
   * portals there; otherwise outside clicks close the dialog before a day is selected.
   */
  popoverContainer?: HTMLElement | DocumentFragment | null;
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = 'اختر تاريخاً',
  minDate,
  maxDate,
  disabled,
  className,
  id,
  popoverContainer,
}: DatePickerInputProps) {
  const [open, setOpen] = React.useState(false);
  const selected = ymdToDate(value);
  const minD = ymdToDate(minDate ?? '');
  const maxD = ymdToDate(maxDate ?? '');

  const disabledMatchers = React.useMemo((): Matcher | Matcher[] | undefined => {
    const list: Matcher[] = [];
    if (minD) list.push({ before: minD });
    if (maxD) list.push({ after: maxD });
    if (list.length === 0) return undefined;
    return list.length === 1 ? list[0]! : list;
  }, [minD, maxD]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start gap-2 text-sm font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0 opacity-60" />
          {selected ? formatDisplay(selected) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto overflow-visible p-0"
        align="start"
        container={popoverContainer ?? undefined}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? new Date()}
          onSelect={(d) => {
            if (d) { onChange(dateToYmd(d)); setOpen(false); }
          }}
          disabled={disabledMatchers}
        />
      </PopoverContent>
    </Popover>
  );
}
