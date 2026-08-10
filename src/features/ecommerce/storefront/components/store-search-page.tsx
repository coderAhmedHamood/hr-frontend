import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { StoreSearchResults } from '@/features/ecommerce/storefront/components/store-search-results';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';

async function SearchFallback() {
  const t = await getTranslations('storefront');
  return (
    <div className="py-12 text-center text-sm text-muted-foreground" aria-busy="true">
      {t('common.loading')}
    </div>
  );
}

export async function StoreSearchPage() {
  const t = await getTranslations('storefront');

  return (
    <div className="flex flex-col gap-6">
      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: t('search.title'), path: '/store/search' },
        ]}
      />
      <h1 className="font-arabic-display text-2xl font-bold text-foreground">{t('search.title')}</h1>
      <Suspense fallback={<SearchFallback />}>
        <StoreSearchResults />
      </Suspense>
    </div>
  );
}
