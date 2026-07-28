'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { StorefrontCompanyConfig } from '@/features/ecommerce/storefront/domain/storefront-models';
import { Link } from '@/i18n/navigation';
import { cn } from '@/shared/utils';

const DISMISS_STORAGE_KEY = 'storefront-announcement-dismissed';

type Props = {
  announcement: StorefrontCompanyConfig['announcement'];
  className?: string;
};

export function StoreAnnouncementBar({ announcement, className }: Props) {
  const t = useTranslations('storefront');
  const [dismissed, setDismissed] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  const fingerprint = React.useMemo(
    () => `${announcement.message}|${announcement.href ?? ''}`,
    [announcement.message, announcement.href],
  );

  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem(DISMISS_STORAGE_KEY);
      setDismissed(stored === fingerprint);
    } catch {
      setDismissed(false);
    }
    setReady(true);
  }, [fingerprint]);

  if (!announcement.enabled || !announcement.message.trim()) return null;
  if (!ready || dismissed) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_STORAGE_KEY, fingerprint);
    } catch {
      // ignore
    }
    setDismissed(true);
  }

  const content = (
    <span className="mx-auto block max-w-[1400px] px-10 text-center text-xs font-medium sm:text-sm">
      {announcement.message}
    </span>
  );

  return (
    <div
      role="region"
      aria-label={t('a11y.announcement')}
      className={cn(
        'relative bg-primary text-primary-foreground',
        className,
      )}
    >
      {announcement.href ? (
        <Link
          href={announcement.href}
          prefetch={false}
          className="block py-2 transition-opacity hover:opacity-90"
        >
          {content}
        </Link>
      ) : (
        <div className="py-2">{content}</div>
      )}

      {announcement.dismissible ? (
        <button
          type="button"
          className="absolute end-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-primary-foreground/80 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground"
          aria-label={t('a11y.dismissAnnouncement')}
          onClick={dismiss}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
