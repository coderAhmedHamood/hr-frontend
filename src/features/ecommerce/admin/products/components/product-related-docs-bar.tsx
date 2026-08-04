'use client';

import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  ChevronDown,
  History,
  Layers,
  MapPinned,
  PackageMinus,
  PackagePlus,
  RefreshCw,
} from 'lucide-react';
import * as React from 'react';
import { cn } from '@/shared/utils';

export type ProductRelatedDocKey =
  | 'putaway'
  | 'variants'
  | 'replenish'
  | 'receipts'
  | 'issues'
  | 'internals'
  | 'moves';

export type ProductRelatedDocChip = {
  key: ProductRelatedDocKey;
  label: string;
  count: number;
  disabled?: boolean;
  hint?: string;
};

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
  className?: string;
  /** When true, start collapsed (typical for new products). */
  defaultCollapsed?: boolean;
  collapsedHint?: string;
};

/** Compact related-ops toolbar — secondary to the product form itself. */
export function ProductRelatedDocsBar({
  chips,
  activeKey,
  onSelect,
  className,
  defaultCollapsed = false,
  collapsedHint = 'عمليات المخزون والمستندات المرتبطة',
}: Props) {
  const [open, setOpen] = React.useState(!defaultCollapsed);

  return (
    <div className={cn('w-full', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5 text-start transition-colors hover:bg-muted/50"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{collapsedHint}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {open ? 'إخفاء الاختصارات' : 'عرض المتغيرات، التجديد، الحركات…'}
          </p>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open ? (
        <div
          className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none"
          role="toolbar"
          aria-label="مستندات المنتج"
        >
          {chips.map((chip) => {
            const Icon = DOC_ICONS[chip.key];
            const active = activeKey === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                disabled={chip.disabled}
                title={chip.hint ?? chip.label}
                aria-pressed={active}
                onClick={() => onSelect(chip.key)}
                className={cn(
                  'group flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-all',
                  chip.disabled
                    ? 'cursor-not-allowed border-border/50 bg-muted/20 text-muted-foreground opacity-60'
                    : active
                      ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                      : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5',
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', active ? 'opacity-100' : 'text-muted-foreground')} />
                <span>{chip.label}</span>
                <span
                  className={cn(
                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums',
                    active
                      ? 'bg-background/20 text-primary-foreground'
                      : chip.count > 0
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
