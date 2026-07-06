'use client';

import * as React from 'react';
import { ChevronDown, ListChecks, ListX, Search } from 'lucide-react';
import { cn } from '@/shared/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type MultiSelectOption = {
  value: string;
  label: string;
  subtitle?: string;
  disabled?: boolean;
};

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  /** Trigger label when nothing selected */
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  selectAllLabel?: string;
  deselectAllLabel?: string;
  id?: string;
  /** Scrollable list max height */
  listMaxHeight?: string;
  /** Optional label above trigger */
  label?: string;
  /** Hold selection locally until user clicks apply — onChange fires once on apply only */
  deferCommit?: boolean;
  applyLabel?: string;
  cancelLabel?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'اختر عناصر…',
  searchPlaceholder = 'بحث في القائمة…',
  emptyMessage = 'لا توجد نتائج',
  disabled,
  className,
  triggerClassName,
  selectAllLabel = 'تحديد الكل',
  deselectAllLabel = 'إلغاء التحديد',
  id,
  listMaxHeight = 'min(240px,40vh)',
  label,
  deferCommit = false,
  applyLabel = 'تطبيق',
  cancelLabel = 'إلغاء',
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [pending, setPending] = React.useState<string[]>(value);

  React.useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  React.useEffect(() => {
    if (!open) setPending(value);
  }, [value, open]);

  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return options;
    return options.filter((o) => {
      const hay = `${o.label} ${o.subtitle ?? ''}`.toLowerCase();
      return hay.includes(t);
    });
  }, [options, q]);

  const enabledAll = React.useMemo(() => options.filter((o) => !o.disabled), [options]);

  const openPopover = React.useCallback(
    (next: boolean) => {
      if (next) {
        setPending(value);
      }
      setOpen(next);
    },
    [value],
  );

  const activeValue = deferCommit && open ? pending : value;
  const selectedSet = React.useMemo(() => new Set(activeValue), [activeValue]);

  const setSelection = React.useCallback(
    (next: string[]) => {
      if (deferCommit && open) {
        setPending(next);
        return;
      }
      onChange(next);
    },
    [deferCommit, open, onChange],
  );

  const toggle = (v: string, checked: boolean) => {
    const opt = options.find((o) => o.value === v);
    if (opt?.disabled) return;
    if (checked) setSelection([...activeValue, v]);
    else setSelection(activeValue.filter((x) => x !== v));
  };

  const selectAll = () => {
    setSelection(enabledAll.map((o) => o.value));
  };

  const deselectAll = () => {
    setSelection([]);
  };

  const pendingDirty = React.useMemo(() => {
    if (pending.length !== value.length) return true;
    const saved = new Set(value);
    return pending.some((id) => !saved.has(id));
  }, [pending, value]);

  const applyPending = () => {
    if (pendingDirty) onChange(pending);
    setOpen(false);
  };

  const cancelPending = () => {
    setPending(value);
    setOpen(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (deferCommit && !next && open) {
      cancelPending();
      return;
    }
    openPopover(next);
  };

  const summary =
    activeValue.length === 0 ? (
      <span className="text-muted-foreground">{placeholder}</span>
    ) : (
      <span className="font-medium text-foreground">
        <span className="number-ar">{activeValue.length}</span> محدد
      </span>
    );

  return (
    <div className={cn('space-y-2', className)}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-expanded={open}
            aria-haspopup="listbox"
            className={cn(
              'h-11 w-full justify-between rounded-md border-input bg-background px-4 py-2 text-sm font-normal shadow-none hover:bg-accent/40',
              'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              triggerClassName,
            )}
          >
            <span className="truncate text-right">{summary}</span>
            <ChevronDown className={cn('h-4 w-4 shrink-0 opacity-60 transition-transform', open && 'rotate-180')} />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="bottom"
          sticky="partial"
          collisionPadding={16}
          className="popover-match-trigger min-w-[min(100%,280px)] max-w-[calc(100vw-2rem)] overflow-hidden border-border p-0 shadow-luxe"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="border-b border-border bg-muted/30 px-3 py-2">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 border-border/80 bg-background pr-9 text-sm"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5 text-xs text-primary hover:bg-primary/10"
                onClick={selectAll}
              >
                <ListChecks className="h-3.5 w-3.5" />
                {selectAllLabel}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={deselectAll}
                disabled={activeValue.length === 0}
              >
                <ListX className="h-3.5 w-3.5" />
                {deselectAllLabel}
              </Button>
            </div>
          </div>
          <Separator />
          <div
            className="touch-pan-y overflow-y-auto overscroll-contain p-1"
            style={{
              maxHeight: `min(${listMaxHeight}, calc(var(--radix-popover-content-available-height, 70dvh) - 9rem))`,
            }}
            role="listbox"
            aria-multiselectable
          >
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
            ) : (
              filtered.map((opt) => {
                const checked = selectedSet.has(opt.value);
                return (
                  <label
                    key={opt.value}
                    role="option"
                    aria-selected={checked}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-right text-sm transition-colors',
                      opt.disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-accent/70',
                      checked && 'bg-primary/8',
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={opt.disabled}
                      onCheckedChange={(v) => toggle(opt.value, v === true)}
                    />
                    <div className="min-w-0 flex-1 text-right">
                      <p className="truncate font-medium leading-tight">{opt.label}</p>
                      {opt.subtitle ? (
                        <p className="truncate font-mono text-[11px] text-muted-foreground" dir="ltr">
                          {opt.subtitle}
                        </p>
                      ) : null}
                    </div>
                  </label>
                );
              })
            )}
          </div>
          {deferCommit ? (
            <>
              <Separator />
              <div className="flex gap-2 p-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-9 flex-1 text-xs"
                  disabled={!pendingDirty}
                  onClick={applyPending}
                >
                  {applyLabel}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 flex-1 text-xs"
                  onClick={cancelPending}
                >
                  {cancelLabel}
                </Button>
              </div>
            </>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
