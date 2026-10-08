'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import type { StoreCountry } from '@/features/ecommerce/domain/constants/store-country';
import {
  parseStoreMobile,
  sanitizeMobileTyping,
  storeMobileNational,
  type StoreMobileResult,
} from '@/features/ecommerce/domain/store-mobile';
import { Input } from '@/components/ui/input';
import { cn } from '@/shared/utils';

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  country: StoreCountry;
  /** Show the error before the field is left (after a submit). */
  showError?: boolean;
  className?: string;
  required?: boolean;
};

/** The Arabic/English message for a refused number, or null. */
export function useStoreMobileError() {
  const t = useTranslations('storefront.fields.mobile');
  return React.useCallback(
    (result: StoreMobileResult, country: StoreCountry): string | null => {
      if (result.ok) return null;
      const values = {
        code: country.phoneCode,
        country: country.nameAr,
        length: country.mobileLength ?? 9,
        example: country.mobileExample ?? '',
        prefixes: (country.mobilePrefixes ?? []).join(' / '),
      };
      return t(`errors.${result.reason}`, values);
    },
    [t],
  );
}

/**
 * Mobile number of the store's country: the dialling code is fixed (+967),
 * only digits are kept, and any pasted form (+966…, 00966…, 0…) is read as
 * the same number.
 */
export function StoreMobileInput({
  id,
  value,
  onChange,
  country,
  showError,
  className,
  required,
}: Props) {
  const t = useTranslations('storefront.fields.mobile');
  const errorOf = useStoreMobileError();
  const [touched, setTouched] = React.useState(false);
  const result = parseStoreMobile(value, country);
  const error = (touched || showError) && value.trim() ? errorOf(result, country) : null;
  const missing = showError && required && !value.trim() ? t('errors.empty') : null;
  const message = error ?? missing;

  return (
    <div className={cn('space-y-1', className)}>
      <div
        dir="ltr"
        className={cn(
          'flex h-10 items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1',
          message && 'border-destructive focus-within:ring-destructive/40',
        )}
      >
        <span
          className="flex select-none items-center gap-1 border-e border-input bg-muted/60 px-3 text-sm font-medium tabular-nums text-muted-foreground"
          title={country.nameAr}
        >
          +{country.phoneCode}
        </span>
        <Input
          id={id}
          dir="ltr"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={value}
          placeholder={country.mobileExample}
          onChange={(e) => onChange(sanitizeMobileTyping(e.target.value))}
          onBlur={() => {
            setTouched(true);
            onChange(storeMobileNational(value, country));
          }}
          aria-invalid={Boolean(message)}
          aria-describedby={`${id}-hint`}
          required={required}
          className="h-full flex-1 rounded-none border-0 tabular-nums shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      <p
        id={`${id}-hint`}
        className={cn('text-[11px]', message ? 'text-destructive' : 'text-muted-foreground')}
      >
        {message ?? t('hint', { example: country.mobileExample ?? '', country: country.nameAr })}
      </p>
    </div>
  );
}
