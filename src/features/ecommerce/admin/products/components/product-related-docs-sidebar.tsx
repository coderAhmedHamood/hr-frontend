'use client';

import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  ChevronLeft,
  History,
  Layers,
  MapPinned,
  PackageMinus,
  PackagePlus,
  RefreshCw,
} from 'lucide-react';
import {
  type ProductRelatedDocChip,
  type ProductRelatedDocKey,
} from '@/features/ecommerce/admin/products/components/product-related-docs-bar';
import { cn } from '@/shared/utils';

const DOC_ICONS: Record<ProductRelatedDocKey, LucideIcon> = {
  putaway: MapPinned,
  variants: Layers,
  replenish: RefreshCw,
  receipts: PackagePlus,
  issues: PackageMinus,
  internals: ArrowLeftRight,
  moves: History,
};

type Props = {
  chips: ProductRelatedDocChip[];
  activeKey?: ProductRelatedDocKey | null;
  onSelect: (key: ProductRelatedDocKey) => void;
};

/** Vertical "linked records" card for the product detail page sidebar. */
export function ProductRelatedDocsSidebar({ chips, activeKey, onSelect }: Props) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-3 sm:p-4">
      <h2 className="px-1.5 pb-3 text-sm font-semibold text-foreground">السجلات المرتبطة</h2>
      <div className="space-y-1">
        {chips.map((chip) => {
          const Icon = DOC_ICONS[chip.key];
          const active = activeKey === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              disabled={chip.disabled}
              onClick={() => onSelect(chip.key)}
              title={chip.hint ?? chip.label}
              aria-pressed={active}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-start transition-colors',
                chip.disabled
                  ? 'cursor-not-allowed opacity-50'
                  : active
                    ? 'bg-primary/10'
                    : 'hover:bg-muted/60',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('block truncate text-sm font-medium', active ? 'text-primary' : 'text-foreground')}>
                  {chip.label}
                </span>
                {chip.hint ? (
                  <span className="block truncate text-[11px] text-muted-foreground">{chip.hint}</span>
                ) : null}
              </span>
              {chip.count != null ? (
                <span
                  className={cn(
                    'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums',
                    active
                      ? 'bg-primary/15 text-primary'
                      : chip.count > 0
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {chip.count}
                </span>
              ) : null}
              <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
