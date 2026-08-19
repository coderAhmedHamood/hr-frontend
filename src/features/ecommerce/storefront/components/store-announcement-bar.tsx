'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { clampAnnouncementSpeedMs } from '@/features/ecommerce/storefront/domain/company-config';
import type { StorefrontCompanyConfig } from '@/features/ecommerce/storefront/domain/storefront-models';
import { Link } from '@/i18n/navigation';
import { cn } from '@/shared/utils';

const DISMISS_STORAGE_KEY = 'storefront-announcement-dismissed';

type AnnouncementItem = StorefrontCompanyConfig['announcement']['items'][number];

type Props = {
  announcement: StorefrontCompanyConfig['announcement'];
  className?: string;
};

export function StoreAnnouncementBar({ announcement, className }: Props) {
  const t = useTranslations('storefront');
  const [dismissed, setDismissed] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  const items = announcement.items;
  const scrolling = announcement.scrolling !== false;
  const speedMs = clampAnnouncementSpeedMs(announcement.speedMs);
  const fingerprint = React.useMemo(
    () =>
      items.map((item) => `${item.id}:${item.message}|${item.href ?? ''}`).join('||'),
    [items],
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

  if (!announcement.enabled || items.length === 0) return null;
  if (!ready || dismissed) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_STORAGE_KEY, fingerprint);
    } catch {
      // ignore
    }
    setDismissed(true);
  }

  const displayItems = scrolling ? [...items, ...items] : items;

  return (
    <div
      role="region"
      aria-label={t('a11y.announcement')}
      className={cn('relative bg-primary text-primary-foreground', className)}
    >
      <div
        className={cn(
          'storefront-announcement-marquee py-2',
          !scrolling && 'storefront-announcement-marquee--static',
        )}
      >
        <div
          className="storefront-announcement-marquee__track"
          style={
            scrolling
              ? { ['--announcement-marquee-duration' as string]: `${speedMs}ms` }
              : undefined
          }
        >
          {displayItems.map((item, index) => (
            <React.Fragment key={`${item.id}-${index}`}>
              {index > 0 ? (
                <span className="storefront-announcement-marquee__sep" aria-hidden>
                  •
                </span>
              ) : null}
              <AnnouncementMarqueeItem item={item} />
            </React.Fragment>
          ))}
        </div>
      </div>

      {announcement.dismissible ? (
        <button
          type="button"
          className="absolute end-2 top-1/2 z-10 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-primary-foreground/80 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground"
          aria-label={t('a11y.dismissAnnouncement')}
          onClick={dismiss}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

function AnnouncementMarqueeItem({ item }: { item: AnnouncementItem }) {
  const className =
    'storefront-announcement-marquee__item text-xs font-medium sm:text-sm';

  if (item.href) {
    return (
      <Link
        href={item.href}
        prefetch={false}
        className={cn(className, 'transition-opacity hover:opacity-90')}
      >
        {item.message}
      </Link>
    );
  }

  return <span className={className}>{item.message}</span>;
}
