'use client';

import { Pencil } from 'lucide-react';
import { cn } from '@/shared/utils';
import { formatLatinNumber } from '@/features/hr/payroll/lib/compensation-preview';

type Props = {
  amount: number;
  colorClass?: string;
  disabled?: boolean;
  onEditClick: () => void;
  onDoubleClick?: () => void;
};

/** Read-only amount with pen button — no inline number input (avoids scroll/arrow edits). */
export function AdjustableAmountCell({
  amount,
  colorClass,
  disabled,
  onEditClick,
  onDoubleClick,
}: Props) {
  return (
    <td
      className={cn(
        'border-e border-border/40 px-1 py-1',
        onDoubleClick && 'cursor-pointer select-none',
      )}
      onDoubleClick={onDoubleClick}
      title={onDoubleClick ? 'انقر مرتين لعرض التفاصيل' : undefined}
    >
      <div className="relative flex items-center justify-center gap-1 px-1">
        <span className={cn('font-mono tabular-nums text-[11.5px] font-medium', colorClass)}>
          {formatLatinNumber(amount)}
        </span>
        {!disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-primary/10 hover:text-primary"
            aria-label="تعديل المبلغ"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>
    </td>
  );
}
