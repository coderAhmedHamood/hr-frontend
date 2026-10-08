'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { suggestEmail } from '@/shared/lib/email-typos';
import { Input } from '@/components/ui/input';
import { cn } from '@/shared/utils';

/** name@domain.tld — one @, a dot in the domain, no spaces. */
export function isEmailShape(value: string): boolean {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(value.trim());
}

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  showError?: boolean;
  required?: boolean;
};

/**
 * Email with a "did you mean …?" for slips of the well-known providers
 * (@gmaic.com → @gmail.com). Company domains (@cleanlife.sa) pass as typed.
 */
export function StoreEmailInput({ id, value, onChange, showError, required }: Props) {
  const t = useTranslations('storefront.fields.email');
  const [touched, setTouched] = React.useState(false);
  const trimmed = value.trim();
  const suggestion = trimmed && isEmailShape(trimmed) ? suggestEmail(trimmed.toLowerCase()) : null;
  const invalid = (touched || showError) && trimmed && !isEmailShape(trimmed);
  const missing = showError && required && !trimmed;

  return (
    <div className="space-y-1">
      <Input
        id={id}
        type="email"
        dir="ltr"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        value={value}
        placeholder="name@gmail.com"
        onChange={(e) => onChange(e.target.value.replace(/\s/g, ''))}
        onBlur={() => setTouched(true)}
        aria-invalid={Boolean(invalid || missing || suggestion)}
        aria-describedby={`${id}-hint`}
        required={required}
        className={cn((invalid || missing) && 'border-destructive')}
      />
      {suggestion && (touched || showError) ? (
        <p id={`${id}-hint`} className="text-[12px] text-amber-700 dark:text-amber-400">
          {t('suggest')}{' '}
          <button
            type="button"
            dir="ltr"
            className="font-semibold underline underline-offset-2"
            onClick={() => onChange(suggestion)}
          >
            {suggestion}
          </button>
          {t('suggestEnd')}
        </p>
      ) : invalid || missing ? (
        <p id={`${id}-hint`} className="text-[11px] text-destructive">
          {missing ? t('required') : t('invalid')}
        </p>
      ) : null}
    </div>
  );
}

/** Whether the email can be sent (shape ok, no pending typo). */
export function storeEmailBlocker(value: string): 'required' | 'invalid' | 'typo' | null {
  const trimmed = value.trim();
  if (!trimmed) return 'required';
  if (!isEmailShape(trimmed)) return 'invalid';
  if (suggestEmail(trimmed.toLowerCase())) return 'typo';
  return null;
}
