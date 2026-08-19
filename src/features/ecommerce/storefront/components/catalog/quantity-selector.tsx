'use client';

import { Minus, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { isRtlLocale } from '@/i18n/routing';
import { cn } from '@/shared/utils';

type QuantitySelectorProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
};

export function QuantitySelector({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
  className,
}: QuantitySelectorProps) {
  const t = useTranslations('storefront.a11y');
  const locale = useLocale();
  const isRtl = isRtlLocale(locale);

  function decrement() {
    onChange(Math.max(min, value - 1));
  }

  function increment() {
    onChange(Math.min(max, value + 1));
  }

  const decreaseBtn = (
    <button
      type="button"
      onClick={decrement}
      disabled={disabled || value <= min}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed',
        isRtl ? 'rounded-r-lg' : 'rounded-l-lg',
      )}
      aria-label={t('decreaseQuantity')}
    >
      <Minus className="h-4 w-4" aria-hidden />
    </button>
  );

  const increaseBtn = (
    <button
      type="button"
      onClick={increment}
      disabled={disabled || value >= max}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed',
        isRtl ? 'rounded-l-lg' : 'rounded-r-lg',
      )}
      aria-label={t('increaseQuantity')}
    >
      <Plus className="h-4 w-4" aria-hidden />
    </button>
  );

  return (
    <div
      dir="rtl"
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-background',
        disabled && 'opacity-50',
        className,
      )}
    >
      {/* RTL: + N − | LTR: − N + */}
      {isRtl ? increaseBtn : decreaseBtn}
      <span className="min-w-10 px-2 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      {isRtl ? decreaseBtn : increaseBtn}
    </div>
  );
}
