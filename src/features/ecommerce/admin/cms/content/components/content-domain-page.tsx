'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { CmsPagesPage } from '@/features/ecommerce/admin/cms/pages/components/cms-pages-page';
import { BlogCmsPage } from '@/features/ecommerce/admin/cms/blog/components/blog-cms-page';
import { FaqCmsPage } from '@/features/ecommerce/admin/cms/faq/components/faq-cms-page';
import type { EcommerceContentTab } from '@/features/ecommerce/admin/constants/routes';

const CONTENT_TABS: EcommerceContentTab[] = ['pages', 'blog', 'faq'];

function resolveContentTab(value: string | null): EcommerceContentTab {
  if (value && CONTENT_TABS.includes(value as EcommerceContentTab)) {
    return value as EcommerceContentTab;
  }
  return 'pages';
}

/**
 * Content domain — Pages, Blog, and FAQ.
 * Active panel is deep-linked via `?tab=` from Website → Content nav items
 * (no in-page tab bar — switch from the top nav).
 */
export function ContentDomainPage() {
  const t = useTranslations('ecommerceAdmin.content');
  const searchParams = useSearchParams();
  const tab = resolveContentTab(searchParams.get('tab'));

  const titleKey =
    tab === 'blog' ? 'tabs.blog' : tab === 'faq' ? 'tabs.faq' : 'tabs.pages';

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr={t(titleKey)} descriptionAr={t('description')} iconName="FileText" />

      {tab === 'pages' ? <CmsPagesPage embedded /> : null}
      {tab === 'blog' ? <BlogCmsPage embedded /> : null}
      {tab === 'faq' ? <FaqCmsPage embedded /> : null}
    </div>
  );
}
