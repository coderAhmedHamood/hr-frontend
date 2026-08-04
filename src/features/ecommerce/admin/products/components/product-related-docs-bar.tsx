'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowLeftRight, History, Layers, MapPinned, PackageMinus, PackagePlus, RefreshCw } from 'lucide-react';
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
};

/** Smart buttons: icon + count + label — open related config screens / sections. */
export function ProductRelatedDocsBar({ chips, activeKey, onSelect, className }: Props) {
  return (
    <div className={cn('flex flex-wrap justify-end gap-2', className)} role="toolbar" aria-label="مستندات المنتج">
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
              'group relative flex min-h-[4.5rem] min-w-[5.75rem] max-w-[7.5rem] flex-col items-center justify-center gap-1 rounded-xl border px-2.5 py-2 text-center transition-all',
              chip.disabled
                ? 'cursor-not-allowed border-border/50 bg-muted/20 text-muted-foreground opacity-60'
                : active
                  ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                  : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5',
            )}
          >
            <span
              className={cn(
                'absolute -top-1.5 start-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold tabular-nums',
                active
                  ? 'bg-background text-foreground'
                  : chip.count > 0
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
              )}
            >
              {chip.count}
            </span>
            <Icon
              className={cn(
                'h-5 w-5 shrink-0',
                active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary',
              )}
            />
            <span className={cn('text-[11px] font-medium leading-tight', active ? 'text-primary-foreground' : '')}>
              {chip.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
