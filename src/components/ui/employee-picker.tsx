'use client';

import * as React from 'react';
import { Users, X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/shared/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFilterPermission } from '@/features/auth/permissions/use-filter-permission';

export type EmployeePickerOption = {
  id: string;
  name: string;
  branchNameAr?: string;
  departmentNameAr?: string;
};

export type EmployeePickerProps = {
  employees: EmployeePickerOption[];
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
  /** Fired when the popover opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Fired on trigger press — use to lazy-load options before the popover opens. */
  onRequestLoad?: () => void;
  /** Show a loading state while options are being fetched. */
  loading?: boolean;
  /** Compact chip for toolbars; full-width field for forms and drawers. */
  variant?: 'toolbar' | 'form';
  /**
   * filter — empty selection means «جميع الموظفين» (list filtering).
   * target — empty selection means no recipients chosen yet (circulars, required sends).
   */
  selectionMode?: 'filter' | 'target';
  className?: string;
  disabled?: boolean;
  /** When set, opening without this permission shows a toast and blocks the popover. */
  requirePermission?: string;
};

function useEmployeePickerState({
  employees,
  selected,
  onChange,
  onOpenChange,
  selectionMode,
  canOpen = () => true,
}: Pick<EmployeePickerProps, 'employees' | 'selected' | 'onChange' | 'onOpenChange' | 'selectionMode'> & {
  canOpen?: () => boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (next && !canOpen()) return;
      setOpen(next);
      onOpenChange?.(next);
    },
    [canOpen, onOpenChange],
  );

  React.useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const safeEmployees = React.useMemo(
    () =>
      employees.filter(
        (e): e is EmployeePickerOption =>
          e != null && typeof e.id === 'string' && typeof e.name === 'string',
      ),
    [employees],
  );

  const filtered = React.useMemo(() => {
    const q = search.trim();
    if (!q) return safeEmployees;
    return safeEmployees.filter((e) => e.name.includes(q));
  }, [safeEmployees, search]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const clearAll = () => onChange(new Set());

  const allSelected =
    safeEmployees.length > 0 && safeEmployees.every((e) => selected.has(e.id));

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((e) => selected.has(e.id));

  const toggleAll = () => {
    if (allSelected) onChange(new Set());
    else onChange(new Set(safeEmployees.map((e) => e.id)));
  };

  const toggleAllFiltered = () => {
    const next = new Set(selected);
    if (allFilteredSelected) {
      for (const e of filtered) next.delete(e.id);
    } else {
      for (const e of filtered) next.add(e.id);
    }
    onChange(next);
  };

  const label = React.useMemo(() => {
    if (selectionMode === 'target' && selected.size === 0) {
      return 'اختر الموظفين…';
    }
    if (selected.size === 0 || allSelected) {
      return 'جميع الموظفين';
    }
    if (selected.size === 1) {
      return safeEmployees.find((e) => e.id === [...selected][0])?.name ?? '1 موظف';
    }
    return `${selected.size} موظفين`;
  }, [allSelected, safeEmployees, selected, selectionMode]);

  return {
    open,
    handleOpenChange,
    search,
    setSearch,
    safeEmployees,
    filtered,
    toggle,
    clearAll,
    allSelected,
    allFilteredSelected,
    toggleAll,
    toggleAllFiltered,
    label,
  };
}

function EmployeeRow({
  emp,
  isSelected,
  onToggle,
  showMeta,
}: {
  emp: EmployeePickerOption;
  isSelected: boolean;
  onToggle: () => void;
  showMeta: boolean;
}) {
  const meta = [emp.departmentNameAr, emp.branchNameAr].filter(Boolean).join(' · ');

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-muted/40',
        isSelected ? 'font-medium text-primary' : 'text-foreground/80',
      )}
    >
      <span
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
          isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
        )}
      >
        {isSelected ? <Check className="h-3 w-3" /> : null}
      </span>
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
        {emp.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1 text-start">
        <span className="block truncate">{emp.name}</span>
        {showMeta && meta ? (
          <span className="block truncate text-[11px] font-normal text-muted-foreground">{meta}</span>
        ) : null}
      </div>
    </button>
  );
}

export function EmployeePicker({
  employees,
  selected,
  onChange,
  onOpenChange,
  onRequestLoad,
  loading = false,
  variant = 'toolbar',
  selectionMode = 'filter',
  className,
  disabled = false,
  requirePermission,
}: EmployeePickerProps) {
  const filterAccess = useFilterPermission(requirePermission);
  const canOpenPicker = React.useCallback(() => {
    if (requirePermission && !filterAccess.allowed) {
      filterAccess.notifyDenied();
      return false;
    }
    return true;
  }, [filterAccess, requirePermission]);

  const state = useEmployeePickerState({
    employees,
    selected,
    onChange,
    onOpenChange,
    selectionMode,
    canOpen: canOpenPicker,
  });

  const requestOpen = () => {
    if (!canOpenPicker()) return;
    onRequestLoad?.();
  };
  const hasSelection = selected.size > 0 && !state.allSelected;
  const showMeta = variant === 'form';

  const listContent = loading ? (
    <p className="px-3 py-4 text-center text-xs text-muted-foreground">جاري التحميل…</p>
  ) : state.filtered.length === 0 ? (
    <p className="px-3 py-4 text-center text-xs text-muted-foreground">لا نتائج</p>
  ) : (
    state.filtered.map((emp) => (
      <EmployeeRow
        key={emp.id}
        emp={emp}
        isSelected={selected.has(emp.id)}
        onToggle={() => state.toggle(emp.id)}
        showMeta={showMeta}
      />
    ))
  );

  if (variant === 'form') {
    return (
      <Popover open={state.open} onOpenChange={state.handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            onPointerDown={requestOpen}
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm transition-colors hover:border-ring disabled:cursor-not-allowed disabled:opacity-50',
              hasSelection ? 'text-foreground' : 'text-muted-foreground',
              className,
            )}
          >
            <span className={cn('flex min-w-0 items-center gap-2 truncate', hasSelection && 'font-medium text-foreground')}>
              <Users className="h-4 w-4 shrink-0 opacity-60" />
              <span className="truncate">{state.label}</span>
            </span>
            <ChevronDown className={cn('h-4 w-4 shrink-0 opacity-50 transition-transform', state.open && 'rotate-180')} />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={4}
          dir="rtl"
          className="z-[200] overflow-hidden rounded-xl p-0 shadow-elevated backdrop-blur-xl"
          style={{ width: 'var(--radix-popover-trigger-width)' }}
        >
          <div className="flex items-center gap-2 border-b border-border p-2">
            <button
              type="button"
              onClick={state.toggleAllFiltered}
              title="تحديد المعروضين"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-input transition-colors hover:bg-muted/40"
            >
              <span
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                  state.allFilteredSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border',
                )}
              >
                {state.allFilteredSelected ? <Check className="h-3 w-3" /> : null}
              </span>
            </button>
            <input
              autoFocus
              value={state.search}
              onChange={(e) => state.setSearch(e.target.value)}
              placeholder="بحث عن موظف…"
              className="h-8 min-w-0 flex-1 rounded-md border border-input bg-muted/30 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
            />
          </div>

          {selectionMode === 'filter' ? (
            <button
              type="button"
              onClick={state.toggleAll}
              className={cn(
                'flex w-full items-center gap-2.5 border-b border-border/40 px-3 py-2 text-sm transition-colors hover:bg-muted/40',
                state.allSelected ? 'font-medium text-primary' : 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                  state.allSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                )}
              >
                {state.allSelected ? <Check className="h-3 w-3" /> : null}
              </span>
              جميع الموظفين
            </button>
          ) : null}

          <div className="max-h-60 overflow-y-auto py-1">
            {listContent}
          </div>

          {hasSelection ? (
            <div className="flex items-center justify-between border-t border-border px-3 py-2">
              <span className="text-xs text-muted-foreground">{selected.size} موظف محدد</span>
              <button
                type="button"
                onClick={state.clearAll}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                مسح التحديد
              </button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={state.open} onOpenChange={state.handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          onPointerDown={requestOpen}
          className={cn(
            'flex h-8 max-w-[10rem] shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50',
            hasSelection
              ? 'border-primary/50 bg-primary/10 text-primary'
              : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground',
            className,
          )}
        >
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 max-w-[6.5rem] flex-1 truncate text-start">{state.label}</span>
          {hasSelection ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); state.clearAll(); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); state.clearAll(); } }}
              className="ml-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-primary/20 hover:bg-primary/30"
            >
              <X className="h-2.5 w-2.5" />
            </span>
          ) : null}
          <ChevronDown className={cn('h-3.5 w-3.5 opacity-50 transition-transform', state.open && 'rotate-180')} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={6}
        dir="rtl"
        className="z-[200] w-64 overflow-hidden rounded-xl p-0 shadow-elevated backdrop-blur-xl"
      >
        <div className="border-b border-border p-2">
          <input
            autoFocus
            value={state.search}
            onChange={(e) => state.setSearch(e.target.value)}
            placeholder="بحث عن موظف…"
            className="w-full rounded-lg bg-muted/40 px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <button
          type="button"
          onClick={state.toggleAll}
          className={cn(
            'flex w-full items-center gap-2.5 border-b border-border/40 px-3 py-2 text-sm transition-colors hover:bg-muted/40',
            state.allSelected ? 'font-medium text-primary' : 'text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
              state.allSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
            )}
          >
            {state.allSelected ? <Check className="h-3 w-3" /> : null}
          </span>
          جميع الموظفين
        </button>

        <div className="max-h-56 overflow-y-auto py-1">
          {listContent}
        </div>

        {hasSelection ? (
          <div className="border-t border-border p-2">
            <p className="text-center text-xs text-muted-foreground">{selected.size} موظف محدد</p>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
