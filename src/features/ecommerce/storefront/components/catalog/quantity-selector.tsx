'use client';

import { Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
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

  function decrement() {
    onChange(Math.max(min, value - 1));
  }

  function increment() {
    onChange(Math.min(max, value + 1));
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-background',
        disabled && 'opacity-50',
        className,
      )}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || value <= min}
        className="inline-flex h-9 w-9 items-center justify-center rounded-s-lg text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed"
        aria-label={t('decreaseQuantity')}
      >
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <span className="min-w-10 px-2 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={disabled || value >= max}
        className="inline-flex h-9 w-9 items-center justify-center rounded-e-lg text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed"
        aria-label={t('increaseQuantity')}
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
