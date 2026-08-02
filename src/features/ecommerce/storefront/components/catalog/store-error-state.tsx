'use client';

import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/utils';

type StoreErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

export function StoreErrorState({ title, description, onRetry, className }: StoreErrorStateProps) {
  const t = useTranslations('storefront.common');

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-12 text-center',
        className,
      )}
      role="alert"
    >
      <AlertCircle className="mb-4 h-10 w-10 text-destructive" aria-hidden />
      <h2 className="text-base font-semibold text-foreground">{title ?? t('errorTitle')}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description ?? t('errorDescription')}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t('retry')}
        </button>
      ) : null}
    </div>
  );
}
