'use client';

import * as React from 'react';
import { X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useFilterPanel } from '@/components/layouts/filter-panel-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/shared/utils';

/* ── Trigger button (used in topbar) ─────────────────────────────────── */
export function FilterTrigger() {
  const { setOpen, open, activeCount, fields } = useFilterPanel();
  if (!fields.length) return null;
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        'relative flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
        open || activeCount > 0
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
      )}
      aria-label="الفلاتر"
    >
      <SlidersHorizontal className="h-4 w-4" />
      {activeCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-white">
          {activeCount}
        </span>
      )}
    </button>
  );
}

/* ── Panel ────────────────────────────────────────────────────────────── */
export function FilterPanel() {
  const { open, setOpen, fields, values, setValue, reset, activeCount } = useFilterPanel();

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Slide-in panel from left */}
      <aside
        className={cn(
          'fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col border-r border-border bg-background shadow-elevated',
          'transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="لوحة الفلاتر"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold">الفلاتر</h2>
            {activeCount > 0 && (
              <p className="text-[11px] text-muted-foreground">{activeCount} فلتر نشط</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {activeCount > 0 && (
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={reset} title="إعادة تعيين">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter fields */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {fields.map(field => (
            <div key={field.key} className="space-y-2">
              <Label className="text-xs font-semibold text-foreground/70">{field.label}</Label>

              {field.type === 'text' && (
                <Input
                  placeholder={field.placeholder ?? `ابحث في ${field.label}...`}
                  value={(values[field.key] as string) ?? ''}
                  onChange={e => setValue(field.key, e.target.value)}
                  className="h-9 text-sm"
                />
              )}

              {field.type === 'select' && (
                <Select
                  value={(values[field.key] as string) ?? 'all'}
                  onValueChange={v => setValue(field.key, v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder={field.placeholder ?? 'اختر...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {!field.options?.some((o) => o.value === 'all') ? (
                      <SelectItem value="all">الكل</SelectItem>
                    ) : null}
                    {field.options?.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field.type === 'multiselect' && (
                <div className="space-y-1.5">
                  {field.options?.map(opt => {
                    const current = (values[field.key] as string[]) ?? [];
                    const checked = current.includes(opt.value);
                    return (
                      <label
                        key={opt.value}
                        className={cn(
                          'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors',
                          checked
                            ? 'border-primary/40 bg-primary/8 text-primary font-medium'
                            : 'border-border/60 hover:border-border hover:bg-muted/50',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? current.filter(v => v !== opt.value)
                              : [...current, opt.value];
                            setValue(field.key, next);
                          }}
                        />
                        <span
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                            checked ? 'border-primary bg-primary' : 'border-border/60',
                          )}
                        >
                          {checked && (
                            <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 8" fill="currentColor">
                              <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </span>
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              )}

              {field.type === 'daterange' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground">من</p>
                    <Input
                      type="date"
                      value={(values[`${field.key}_from`] as string) ?? ''}
                      onChange={e => setValue(`${field.key}_from`, e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground">إلى</p>
                    <Input
                      type="date"
                      value={(values[`${field.key}_to`] as string) ?? ''}
                      onChange={e => setValue(`${field.key}_to`, e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {!fields.length && (
            <p className="text-center text-sm text-muted-foreground pt-8">
              لا توجد فلاتر متاحة لهذه الصفحة
            </p>
          )}
        </div>

        {/* Footer */}
        {activeCount > 0 && (
          <div className="border-t border-border/60 p-4">
            <Button variant="outline" className="w-full gap-2" size="sm" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" />
              إعادة تعيين الفلاتر
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
