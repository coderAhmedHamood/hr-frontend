'use client';

import * as React from 'react';
import { Users, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/shared/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type UserPickerOption = {
  id: string;
  name: string;
  email: string | null;
};

export type UserPickerProps = {
  users: UserPickerOption[];
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * Multi-select for specific users — explicit recipients only. There is no
 * implicit "everyone" sentinel: "تحديد الكل" fills the actual id set from
 * what is loaded/filtered right now, so the audience never silently grows
 * later (new users added after this pick are not included).
 */
export function UserPicker({
  users,
  selected,
  onChange,
  loading = false,
  disabled = false,
  className,
}: UserPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const selectable = React.useMemo(() => users.filter((u) => !!u.email), [users]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return selectable;
    return selectable.filter(
      (u) => u.name.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q),
    );
  }, [selectable, search]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((u) => selected.has(u.id));
  const toggleAllFiltered = () => {
    const next = new Set(selected);
    if (allFilteredSelected) {
      for (const u of filtered) next.delete(u.id);
    } else {
      for (const u of filtered) next.add(u.id);
    }
    onChange(next);
  };

  const clearAll = () => onChange(new Set());

  const label =
    selected.size === 0
      ? 'اختر مستخدمين…'
      : selected.size === 1
        ? (selectable.find((u) => u.id === [...selected][0])?.name ?? '1 مستخدم')
        : `${selected.size} مستخدمين`;

  const hasSelection = selected.size > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm transition-colors hover:border-ring disabled:cursor-not-allowed disabled:opacity-50',
            hasSelection ? 'text-foreground' : 'text-muted-foreground',
            className,
          )}
        >
          <span className={cn('flex min-w-0 items-center gap-2 truncate', hasSelection && 'font-medium text-foreground')}>
            <Users className="h-4 w-4 shrink-0 opacity-60" />
            <span className="truncate">{label}</span>
          </span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 opacity-50 transition-transform', open && 'rotate-180')} />
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
            onClick={toggleAllFiltered}
            title="تحديد المعروضين"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-input transition-colors hover:bg-muted/40"
          >
            <span
              className={cn(
                'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                allFilteredSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
              )}
            >
              {allFilteredSelected ? <Check className="h-3 w-3" /> : null}
            </span>
          </button>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد…"
            className="h-8 min-w-0 flex-1 rounded-md border border-input bg-muted/30 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
          />
        </div>

        <div className="max-h-60 overflow-y-auto py-1">
          {loading ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">جاري التحميل…</p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              {selectable.length === 0 ? 'لا يوجد مستخدمون ببريد إلكتروني في هذه الشركة' : 'لا نتائج'}
            </p>
          ) : (
            filtered.map((u) => {
              const isSelected = selected.has(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggle(u.id)}
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
                    {u.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1 text-start">
                    <span className="block truncate">{u.name}</span>
                    {u.email ? (
                      <span className="block truncate text-[11px] font-normal text-muted-foreground" dir="ltr">
                        {u.email}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {hasSelection ? (
          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            <span className="text-xs text-muted-foreground">{selected.size} مستخدم محدد</span>
            <button type="button" onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground">
              مسح التحديد
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
