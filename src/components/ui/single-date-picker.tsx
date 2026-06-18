'use client';

import * as React from 'react';
import { format, isValid } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { CalendarDays, X } from 'lucide-react';
import type { Matcher } from 'react-day-picker';

import { cn, toWesternDigits } from '@/shared/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const ISO = 'yyyy-MM-dd';

/** Parse `yyyy-MM-dd` in local calendar (avoids UTC shift). */
export function parseIsoDateLocal(value: string | undefined): Date | undefined {
  if (!value?.trim()) return undefined;
  const [y, m, d] = value.split('-').map((n) => Number(n));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return undefined;
  const dt = new Date(y, m - 1, d);
  if (
    !isValid(dt)
    || dt.getFullYear() !== y
    || dt.getMonth() !== m - 1
    || dt.getDate() !== d
  ) {
    return undefined;
  }
  return dt;
}

export type SingleDatePickerProps = {
  value: string | undefined;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Root wrapper (e.g. full width in grids). */
  wrapperClassName?: string;
  id?: string;
  name?: string;
  /** Inclusive minimum (`yyyy-MM-dd`). */
  min?: string;
  /** Inclusive maximum (`yyyy-MM-dd`). */
  max?: string;
  align?: 'start' | 'center' | 'end';
  /**
   * Optional portal container for the popover.
   * Avoid passing a dialog panel that uses `overflow-hidden` — the calendar will be clipped.
   * Omit to use the default body portal (recommended inside modals).
   */
  popoverContainer?: HTMLElement | DocumentFragment | null;
};

export function SingleDatePicker({
  value,
  onChange,
  placeholder = 'اختر التاريخ',
  disabled,
  className,
  wrapperClassName,
  id,
  name,
  min,
  max,
  align = 'end',
  popoverContainer,
}: SingleDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseIsoDateLocal(value);

  const disabledMatchers = React.useMemo((): Matcher | Matcher[] | undefined => {
    const list: Matcher[] = [];
    const minD = parseIsoDateLocal(min);
    const maxD = parseIsoDateLocal(max);
    if (minD) list.push({ before: minD });
    if (maxD) list.push({ after: maxD });
    if (list.length === 0) return undefined;
    return list.length === 1 ? list[0]! : list;
  }, [min, max]);

  const dayLabel = selected ? toWesternDigits(format(selected, 'd', { locale: arSA })) : null;
  const monthYearLabel = selected ? toWesternDigits(format(selected, 'MMMM yyyy', { locale: arSA })) : null;
  const weekdayLabel = selected ? format(selected, 'EEEE', { locale: arSA }) : null;

  return (
    <div className={cn('w-full', wrapperClassName)}>
      {name ? <input type="hidden" name={name} value={value ?? ''} aria-hidden /> : null}
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-expanded={open}
            className={cn(
              'group flex h-10 min-w-0 w-full max-w-full items-center gap-2.5 rounded-lg border px-3 text-sm transition-all',
              'border-input bg-background text-right hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
              selected
                ? 'border-primary/30 bg-primary/5 text-foreground'
                : 'text-muted-foreground',
              disabled && 'pointer-events-none opacity-50',
              open && 'border-primary/50 ring-2 ring-primary/20',
              className,
            )}
          >
            <CalendarDays className={cn('h-4 w-4 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')} />
            <span
              className="min-w-0 flex-1 truncate text-right"
              title={selected ? `${weekdayLabel}، ${dayLabel} ${monthYearLabel}` : undefined}
            >
              {selected ? (
                <span className="font-medium">{weekdayLabel}، {dayLabel} {monthYearLabel}</span>
              ) : (
                <span>{placeholder}</span>
              )}
            </span>
            {selected && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="مسح التاريخ"
                onClick={(e) => { e.stopPropagation(); onChange(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onChange(''); } }}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-visible rounded-xl border border-border bg-card p-0 shadow-elevated"
          align={align}
          dir="rtl"
          sideOffset={8}
          collisionPadding={16}
          container={popoverContainer ?? undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected ?? new Date()}
            onSelect={(d) => {
              if (d) onChange(format(d, ISO));
              setOpen(false);
            }}
            disabled={disabledMatchers}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

SingleDatePicker.displayName = 'SingleDatePicker';
