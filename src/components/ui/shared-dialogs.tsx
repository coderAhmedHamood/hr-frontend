'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  dialogFormFooterClass,
  useDialogPortalContainer,
} from '@/components/ui/dialog';
import { cn } from '@/shared/utils';
import { paginationItemCount } from '@/components/ui/sticky-pagination';
import * as PopoverPrimitive from '@radix-ui/react-popover';

// ─── MinimalDropdown ──────────────────────────────────────────────────────────

export interface DropdownOption { value: string; label: string; sub?: string }

interface MinimalDropdownProps {
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  contentClassName?: string;
  optionClassName?: string;
  hideSelectedCheck?: boolean;
  disabled?: boolean;
}

export function MinimalDropdown({
  value,
  onChange,
  options,
  placeholder = 'اختر…',
  className,
  contentClassName,
  optionClassName,
  hideSelectedCheck = false,
  disabled,
}: MinimalDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const dialogContainer = useDialogPortalContainer();
  const selected = options.find(o => o.value === value);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen} modal={false}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={dialogContainer ?? undefined}>
        <PopoverPrimitive.Content
          className={cn(
            'popover-match-trigger z-[200] max-h-64 min-w-[12rem] overflow-auto rounded-md border border-border bg-popover p-1 shadow-elevated',
            contentClassName,
          )}
          sideOffset={4}
          collisionPadding={12}
        >
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
            <button
              key={opt.value || '__empty__'}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                'flex w-full items-center px-3 py-2 text-sm transition-colors',
                hideSelectedCheck ? 'justify-center rounded-md' : 'gap-2 text-right hover:bg-muted/60',
                isSelected
                  ? cn(
                      'font-medium text-primary',
                      hideSelectedCheck ? 'bg-primary/15' : 'bg-primary/10',
                    )
                  : hideSelectedCheck
                    ? 'text-foreground hover:bg-muted/50'
                    : undefined,
                optionClassName,
              )}
            >
              {!hideSelectedCheck ? (
                <Check className={cn('h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
              ) : null}
              <span className={cn('truncate', !hideSelectedCheck && 'flex-1')}>{opt.label}</span>
              {opt.sub && <span className="text-xs text-muted-foreground">{opt.sub}</span>}
            </button>
            );
          })}
          {options.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">لا توجد خيارات</div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

// ─── SearchableDropdown ───────────────────────────────────────────────────────

interface SearchableDropdownProps extends Omit<MinimalDropdownProps, 'onChange'> {
  onChange: (v: string) => void;
  allowClear?: boolean;
  /** Scrollable list height (default max-h-52 ≈ 4 rows). */
  listClassName?: string;
}

export function SearchableDropdown({
  value,
  onChange,
  options,
  placeholder = 'ابحث أو اختر…',
  className,
  contentClassName,
  disabled,
  allowClear,
  listClassName,
}: SearchableDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const dialogContainer = useDialogPortalContainer();
  const selected = options.find(o => o.value === value);
  const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()) || (o.sub?.toLowerCase().includes(q.toLowerCase()))) : options;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQ(''); }} modal={false}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? selected.label : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {allowClear && value && (
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); onChange(''); }}
                className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={dialogContainer ?? undefined}>
        <PopoverPrimitive.Content
          className={cn(
            'popover-match-trigger z-[200] min-w-[12rem] overflow-hidden rounded-md border border-border bg-popover p-0 shadow-elevated',
            contentClassName,
          )}
          sideOffset={4}
          collisionPadding={16}
          avoidCollisions
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث…"
                className="w-full rounded-sm border border-input bg-background py-1.5 pr-7 pl-2 text-sm focus:outline-none"
                autoFocus
              />
            </div>
            {options.length > 0 ? (
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                {filtered.length} / {options.length}
              </p>
            ) : null}
          </div>
          <div
            className={cn(
              'max-h-52 overflow-y-auto overscroll-contain',
              listClassName,
            )}
            onWheel={(e) => e.stopPropagation()}
          >
            {filtered.map(opt => (
              <button
                key={opt.value || '__empty__'}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); setQ(''); }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm text-right hover:bg-muted/60 transition-colors',
                  opt.value === value && 'bg-primary/10 text-primary font-medium',
                )}
              >
                <Check className={cn('h-4 w-4 shrink-0', opt.value === value ? 'opacity-100' : 'opacity-0')} />
                <div className="flex-1 min-w-0">
                  <p className="truncate">{opt.label}</p>
                  {opt.sub && <p className="text-xs text-muted-foreground truncate">{opt.sub}</p>}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">لا توجد نتائج</div>
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

// ─── ConfirmationModal ────────────────────────────────────────────────────────

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  variant?: 'destructive' | 'default';
}

export function ConfirmationModal({
  open, onOpenChange, title = 'تأكيد الحذف',
  description = 'هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟',
  onConfirm, confirmLabel = 'حذف', variant = 'destructive',
}: ConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant={variant} onClick={() => { onConfirm(); onOpenChange(false); }}>{confirmLabel}</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── HRSettingsFormDrawer ─────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  size?: 'md' | 'lg' | 'xl';
  onSave: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  children: React.ReactNode;
  error?: string | null;
  /** لربط قوائم منبثقة (مثل MultiSelect) داخل نفس طبقة محتوى الحوار */
  contentRef?: React.Ref<HTMLDivElement>;
  /** أزرار إضافية بجانب «إلغاء / حفظ» (معاينة PDF، تصدير، …) */
  footerExtra?: React.ReactNode;
}

const DRAWER_SIZE = {
  md: 'max-w-[min(32rem,calc(100vw-1.5rem))]',
  lg: 'max-w-[min(42rem,calc(100vw-1.5rem))]',
  xl: 'max-w-[min(48rem,calc(100vw-1.5rem))]',
};

export function HRSettingsFormDrawer({ open, onOpenChange, title, description, size = 'lg', onSave, saveLabel = 'حفظ', saveDisabled, children, error, contentRef, footerExtra }: DrawerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={contentRef} className={cn('flex max-h-[95vh] w-full flex-col overflow-visible border-border p-0', DRAWER_SIZE[size])}>
        <div className="shrink-0 border-b border-border px-6 py-5">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{title}</DialogTitle>
            <DialogDescription className={cn(!description && 'sr-only')}>
              {description ?? 'املأ الحقول ثم اضغط حفظ لتطبيق التغييرات.'}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-5">
          {children}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
        <DialogFooter className={dialogFormFooterClass}>
          {footerExtra ? <div className="flex flex-wrap gap-2">{footerExtra}</div> : null}
          <Button variant="luxe" type="button" onClick={onSave} disabled={saveDisabled}>{saveLabel}</Button>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── FormField wrapper ────────────────────────────────────────────────────────

export function FormField({ label, required, error, children, span2 }: { label: string; required?: boolean; error?: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={cn('space-y-1.5', span2 && 'sm:col-span-2')}>
      <label className="text-xs font-medium text-muted-foreground">
        {label}{required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-row flex-nowrap items-start justify-between gap-3 sm:gap-4">
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-display text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 truncate text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-nowrap items-center gap-2">{children}</div>}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, description }: { icon?: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="mb-3 h-10 w-10 text-muted-foreground/30" />}
      <p className="font-semibold text-muted-foreground">{title}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function Pagination({ page, perPage, total, onPage, onPerPage }: { page: number; perPage: number; total: number; onPage: (n: number) => void; onPerPage: (n: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const { displayed, total: totalItems } = paginationItemCount(page, perPage, total);
  return (
    <div className="flex min-w-0 flex-col gap-2 border-t border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <span className="min-w-0 text-center tabular-nums sm:text-right" dir="ltr">
        <strong className="text-foreground">{displayed}</strong>
        <span className="mx-0.5 text-muted-foreground/70">/</span>
        <strong className="text-foreground">{totalItems}</strong>
      </span>
      <div className="flex min-w-0 flex-wrap items-center justify-center gap-2 sm:justify-end">
        <select value={perPage} onChange={e => { onPerPage(Number(e.target.value)); onPage(1); }} className="max-w-full shrink-0 rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none">
          {[10, 15, 20, 50].map(n => <option key={n} value={n}>{n} / صفحة</option>)}
        </select>
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>السابق</Button>
        <span className="font-medium">{page} / {pages}</span>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>التالي</Button>
      </div>
    </div>
  );
}

// ─── ActiveBadge ──────────────────────────────────────────────────────────────

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
      active
        ? 'border-success/30 bg-success/10 text-success'
        : 'border-border bg-muted text-muted-foreground',
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-success' : 'bg-muted-foreground')} />
      {active ? 'نشط' : 'موقوف'}
    </span>
  );
}
