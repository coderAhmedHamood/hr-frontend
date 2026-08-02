import { getTranslations } from 'next-intl/server';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import { Link } from '@/i18n/navigation';

export async function StoreNotFoundPage() {
  const t = await getTranslations('storefront');

  return (
    <StoreEmptyState title={t('common.notFoundTitle')} description={t('common.notFoundDescription')}>
      <Link
        href="/store"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        {t('common.backToStore')}
      </Link>
    </StoreEmptyState>
  );
}
