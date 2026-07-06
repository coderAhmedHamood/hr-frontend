'use client';

import type { ReactNode } from 'react';
import { SaudiRiyal } from 'lucide-react';
import { cn, formatMoneyDigits } from '@/shared/utils';

export function isSarCurrency(currency?: string | null): boolean {
  const code = currency?.trim().toUpperCase();
  return !code || code === 'SAR';
}

type SarAmountProps = {
  children: ReactNode;
  currency?: string | null;
  className?: string;
  iconClassName?: string;
  suffix?: ReactNode;
};

/** Amount followed by the Saudi riyal icon (RTL: number then icon). */
export function SarAmount({
  children,
  currency,
  className,
  iconClassName,
  suffix,
}: SarAmountProps) {
  if (!isSarCurrency(currency)) {
    return (
      <span className={cn('tabular-nums', className)} dir="ltr">
        {children}
        {currency ? ` ${currency}` : null}
        {suffix}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-0.5 tabular-nums', className)} dir="rtl">
      <span dir="ltr">{children}</span>
      <SaudiRiyal
        className={cn('h-3.5 w-3.5 shrink-0 text-current opacity-85', iconClassName)}
        aria-hidden
      />
      {suffix ? <span>{suffix}</span> : null}
    </span>
  );
}

type MoneyAmountProps = {
  value: number | string;
  currency?: string | null;
  fractionDigits?: number;
  className?: string;
  iconClassName?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
};

/** Formatted monetary value with Saudi riyal icon when currency is SAR (default). */
export function MoneyAmount({
  value,
  currency,
  fractionDigits = 2,
  className,
  iconClassName,
  prefix,
  suffix,
}: MoneyAmountProps) {
  const formatted = formatMoneyDigits(value, fractionDigits);
  if (formatted === '—') {
    return <span className={cn('tabular-nums', className)}>—</span>;
  }

  return (
    <SarAmount
      currency={currency}
      className={className}
      iconClassName={iconClassName}
      suffix={suffix}
    >
      {prefix}
      {formatted}
    </SarAmount>
  );
}
