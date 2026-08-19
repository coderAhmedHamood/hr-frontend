import { cache } from 'react';
import { getLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { LegalPageSlug } from '@/features/ecommerce/storefront/domain/content';
import type {
  StorefrontAboutContent,
  StorefrontContactContent,
  StorefrontFaqItem,
  StorefrontLegalPage,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import { storefrontContentRepository } from '@/features/ecommerce/storefront/lib/repositories/content-repository';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import type { StorefrontLocale } from '@/i18n/routing';

export const getStorefrontFaq = cache(async (): Promise<StorefrontFaqItem[]> => {
  const locale = (await getLocale()) as StorefrontLocale;
  const companyId = getStorefrontCompanyId();
  return storefrontContentRepository.getFaq(companyId, locale);
});

export const getStorefrontAboutContent = cache(async (): Promise<StorefrontAboutContent> => {
  const locale = (await getLocale()) as StorefrontLocale;
  const companyId = getStorefrontCompanyId();
  const content = await storefrontContentRepository.getAbout(companyId, locale);
  if (!content) notFound();
  return content;
});

export const getStorefrontContactContent = cache(async (): Promise<StorefrontContactContent> => {
  const locale = (await getLocale()) as StorefrontLocale;
  const companyId = getStorefrontCompanyId();
  const content = await storefrontContentRepository.getContact(companyId, locale);
  if (!content) notFound();
  return content;
});

export const getStorefrontLegalPage = cache(async (slug: LegalPageSlug): Promise<StorefrontLegalPage> => {
  const locale = (await getLocale()) as StorefrontLocale;
  const companyId = getStorefrontCompanyId();
  const page = await storefrontContentRepository.getLegalPage(companyId, slug, locale);
  if (!page) notFound();
  return page;
});
