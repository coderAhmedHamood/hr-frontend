'use client';

import { useTranslations } from 'next-intl';

export default function StoreSegmentError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('storefront.common');

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center" role="alert">
      <h2 className="text-xl font-semibold text-foreground">{t('errorTitle')}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{t('errorDescription')}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground"
      >
        {t('retry')}
      </button>
    </div>
  );
}
