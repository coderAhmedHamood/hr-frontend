'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/shared/utils';

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /** Product selected but cost empty — subtle warning only. */
  showRequiredHint?: boolean;
};

export function OperationUnitCostInput({
  value,
  onChange,
  disabled,
  className,
  showRequiredHint,
}: Props) {
  const missing = Boolean(showRequiredHint && !value.trim());

  return (
    <div className={cn('w-full space-y-1', className)}>
      <div className="relative w-full">
        <Input
          type="text"
          inputMode="decimal"
          dir="ltr"
          placeholder="0.00"
          value={value}
          disabled={disabled}
          aria-invalid={missing}
          className={cn(
            'h-10 w-full pe-10 tabular-nums',
            missing && 'border-amber-500/80 focus-visible:ring-amber-500/30',
          )}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '' || /^\d*\.?\d{0,8}$/.test(raw)) {
              onChange(raw);
            }
          }}
        />
        <span className="pointer-events-none absolute inset-y-0 end-2 flex items-center text-[11px] text-muted-foreground">
          ر.ي
        </span>
      </div>
      {missing ? (
        <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">تكلفة الشراء مطلوبة</p>
      ) : null}
    </div>
  );
}
