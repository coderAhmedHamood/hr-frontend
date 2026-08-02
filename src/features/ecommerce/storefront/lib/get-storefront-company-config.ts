import { cache } from 'react';
import { getLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { companyConfigApi } from '@/features/ecommerce/storefront/lib/api/company-config-api';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import type { StorefrontCompanyConfig } from '@/features/ecommerce/storefront/domain/storefront-models';
import type { StorefrontLocale } from '@/i18n/routing';

export const getStorefrontCompanyConfig = cache(async (): Promise<StorefrontCompanyConfig> => {
  const locale = (await getLocale()) as StorefrontLocale;
  const companyId = getStorefrontCompanyId();
  const config = await companyConfigApi.getByCompanyId(companyId, locale);
  if (!config) notFound();
  return config;
});

export const getStorefrontCompanyConfigForLocale = cache(
  async (locale: StorefrontLocale): Promise<StorefrontCompanyConfig> => {
    const companyId = getStorefrontCompanyId();
    const config = await companyConfigApi.getByCompanyId(companyId, locale);
    if (!config) notFound();
    return config;
  },
);
