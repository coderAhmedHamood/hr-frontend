import type { PageType } from '@/features/ecommerce/storefront/page-builder/domain/page-types';
import type { StorefrontPageView } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import { resolvePageSections } from '@/features/ecommerce/storefront/page-builder/lib/section-data-resolvers';
import { storefrontPageRepository } from '@/features/ecommerce/storefront/page-builder/lib/repositories/page-repository';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import type { StorefrontLocale } from '@/i18n/routing';

function deriveSeoTitle(
  sections: StorefrontPageView['sections'],
  fallbackTitle: string,
): string {
  const hero = sections.find((section) => section.type === 'hero-carousel');
  const firstSlideTitle = hero?.type === 'hero-carousel' ? hero.data.slides[0]?.title : undefined;
  return firstSlideTitle || fallbackTitle;
}

export async function loadStorefrontPage(
  companyId: string,
  pageType: PageType,
  locale: StorefrontLocale,
): Promise<StorefrontPageView | null> {
  const page = await storefrontPageRepository.getByPageType(companyId, pageType, locale);
  if (!page) return null;

  const sections = await resolvePageSections({ companyId, locale }, page);
  const config = await getStorefrontCompanyConfig();

  return {
    ...page,
    sections,
    seoTitle: deriveSeoTitle(sections, config.seo.homeTitle),
  };
}

/** Homepage is the first consumer of the generic page builder. */
export async function loadStorefrontHomepage(
  companyId: string,
  locale: StorefrontLocale,
): Promise<StorefrontPageView | null> {
  return loadStorefrontPage(companyId, 'homepage', locale);
}
