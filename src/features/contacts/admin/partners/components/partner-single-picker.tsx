'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { cn } from '@/shared/utils';
import { useDialogPortalContainer } from '@/components/ui/dialog';
import { usePartner, usePartners } from '@/features/contacts/admin/partners/hooks/use-partners';
import type { Partner } from '@/features/contacts/domain/types/partner';

const PAGE_LIMIT = 30;

export type PartnerSinglePickerProps = {
  companyId: string;
  value: string;
  onChange: (partnerId: string) => void;
  /** Fires with the picked partner row (id, names, role flags…). */
  onPartnerSelect?: (partner: Partner) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
  'aria-label'?: string;
};

function partnerRoleLabel(partner: Pick<Partner, 'isCustomer' | 'isVendor' | 'isEmployee'>): string | null {
  const roles: string[] = [];
  if (partner.isCustomer) roles.push('عميل');
  if (partner.isVendor) roles.push('مورد');
  if (partner.isEmployee) roles.push('موظف');
  return roles.length ? roles.join(' · ') : null;
}

/** Searchable single-select for a real Contacts partner — used to optionally
 * link a warehouse operation (استلام/صرف/تحويل) to a customer/vendor instead
 * of a free-typed name. See test.md: "جهات الاتصال — اختياري الآن". */
export function PartnerSinglePicker({
  companyId,
  value,
  onChange,
  onPartnerSelect,
  placeholder = 'ابحث عن جهة اتصال…',
  searchPlaceholder = 'الاسم…',
  disabled,
  allowClear = true,
  className,
  'aria-label': ariaLabel,
}: PartnerSinglePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [pickedPartner, setPickedPartner] = React.useState<Partner | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const dialogContainer = useDialogPortalContainer();

  const hasLocalLabel = Boolean(value) && pickedPartner?.id === value;
  const { data: selectedPartner } = usePartner(companyId, !hasLocalLabel ? value || undefined : undefined);

  const { data, isFetching } = usePartners({
    companyId,
    search: debouncedSearch || undefined,
    page: 1,
    limit: PAGE_LIMIT,
    archiveScope: 'active',
  });
  const results = data?.items ?? [];

  const selectedLabel = value
    ? hasLocalLabel && pickedPartner
      ? pickedPartner.displayName
      : selectedPartner
        ? selectedPartner.displayName
        : '…'
    : null;

  function pick(partner: Partner) {
    setPickedPartner(partner);
    onChange(partner.id);
    onPartnerSelect?.(partner);
    setOpen(false);
    setSearch('');
  }

  function clearSelection(event: React.MouseEvent) {
    event.stopPropagation();
    setPickedPartner(null);
    onChange('');
    setSearch('');
  }

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch('');
      }}
      modal={false}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel ?? 'جهة الاتصال'}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <span className={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
            {selectedLabel ?? placeholder}
          </span>
          <div className="flex items-center gap-1">
            {allowClear && value ? (
              <span
                role="button"
                tabIndex={0}
                onClick={clearSelection}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    clearSelection(event as unknown as React.MouseEvent);
                  }
                }}
                className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </span>
            ) : null}
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={dialogContainer ?? undefined}>
        <PopoverPrimitive.Content
          className="popover-match-trigger z-[200] min-w-[12rem] overflow-hidden rounded-md border border-border bg-popover p-0 shadow-elevated"
          sideOffset={4}
          collisionPadding={16}
          avoidCollisions
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-sm border border-input bg-background py-1.5 pr-7 pl-2 text-sm focus:outline-none"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto overscroll-contain" onWheel={(event) => event.stopPropagation()}>
            {isFetching && results.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                {debouncedSearch ? 'جاري البحث…' : 'جاري التحميل…'}
              </div>
            ) : results.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                {debouncedSearch ? 'لا توجد نتائج مطابقة' : 'لا توجد جهات اتصال'}
              </div>
            ) : (
              results.map((partner) => {
                const isSelected = partner.id === value;
                const roleLabel = partnerRoleLabel(partner);
                return (
                  <button
                    key={partner.id}
                    type="button"
                    onClick={() => pick(partner)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm text-right transition-colors hover:bg-muted/60',
                      isSelected && 'bg-primary/10 font-medium text-primary',
                    )}
                  >
                    <Check className={cn('h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{partner.displayName}</p>
                      {roleLabel ? (
                        <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
