'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type StorefrontLocale } from '@/i18n/routing';
import { cn } from '@/shared/utils';

type StoreLocaleSwitcherProps = {
  className?: string;
  /** `header` = on primary bar; `panel` = inside drawer/light surfaces */
  tone?: 'header' | 'panel';
};

const LOCALE_SHORT: Record<StorefrontLocale, string> = {
  ar: 'ع',
  en: 'EN',
};

export function StoreLocaleSwitcher({ className, tone = 'panel' }: StoreLocaleSwitcherProps) {
  const t = useTranslations('storefront');
  const locale = useLocale() as StorefrontLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();

  const switchTo = (nextLocale: StorefrontLocale) => {
    if (nextLocale === locale || isPending) return;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div
      role="group"
      aria-label={t('a11y.languageSwitcher')}
      className={cn(
        'inline-flex items-center rounded-full p-0.5',
        tone === 'header'
          ? 'bg-primary-foreground/15 ring-1 ring-primary-foreground/25'
          : 'bg-muted ring-1 ring-border',
        isPending && 'opacity-70',
        className,
      )}
    >
      {routing.locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            disabled={isPending}
            aria-pressed={active}
            aria-label={t(`locale.${code}`)}
            title={t(`locale.${code}`)}
            onClick={() => switchTo(code)}
            className={cn(
              'inline-flex h-8 min-w-9 items-center justify-center rounded-full px-2.5 text-xs font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-wait',
              active
                ? tone === 'header'
                  ? 'bg-primary-foreground text-primary shadow-sm focus-visible:ring-primary-foreground/40'
                  : 'bg-background text-foreground shadow-sm focus-visible:ring-ring'
                : tone === 'header'
                  ? 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-primary-foreground/30'
                  : 'text-muted-foreground hover:bg-background/70 hover:text-foreground focus-visible:ring-ring',
            )}
          >
            <span aria-hidden className="font-display tracking-wide">
              {LOCALE_SHORT[code]}
            </span>
            <span className="sr-only">{t(`locale.${code}`)}</span>
          </button>
        );
      })}
    </div>
  );
}
