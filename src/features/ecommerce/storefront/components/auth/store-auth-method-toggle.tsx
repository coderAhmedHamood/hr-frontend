'use client';

import { Mail, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/utils';

export type StoreAuthMethod = 'email' | 'mobile';

/**
 * How the customer signs in or signs up, chosen before typing (2026-10-26):
 * email or mobile, each with the password.
 */
export function StoreAuthMethodToggle({
  value,
  onChange,
}: {
  value: StoreAuthMethod;
  onChange: (value: StoreAuthMethod) => void;
}) {
  const t = useTranslations('storefront');
  const options: Array<{ value: StoreAuthMethod; label: string; icon: typeof Mail }> = [
    { value: 'mobile', label: t('authMethod.mobile'), icon: Smartphone },
    { value: 'email', label: t('authMethod.email'), icon: Mail },
  ];
  return (
    <div
      role="radiogroup"
      aria-label={t('authMethod.aria')}
      className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1"
    >
      {options.map((option) => {
        const active = value === option.value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors',
              active
                ? 'bg-background text-foreground shadow-soft'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
