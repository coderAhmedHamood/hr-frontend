'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { CmsPagesPage } from '@/features/ecommerce/admin/cms/pages/components/cms-pages-page';
import type { EcommerceContentTab } from '@/features/ecommerce/admin/constants/routes';

const CONTENT_TABS: EcommerceContentTab[] = ['pages', 'blog', 'faq'];

function resolveContentTab(value: string | null): EcommerceContentTab {
  if (value && CONTENT_TABS.includes(value as EcommerceContentTab)) {
    return value as EcommerceContentTab;
  }
  return 'pages';
}

/**
 * Content domain — Pages (includes Blog + FAQ as rows).
 * Legacy `?tab=blog|faq` deep-links open the matching panel inside pages.
 */
export function ContentDomainPage() {
  const t = useTranslations('ecommerceAdmin.content');
  const searchParams = useSearchParams();
  const tab = resolveContentTab(searchParams.get('tab'));
  const initialPanel = tab === 'blog' || tab === 'faq' ? tab : 'list';

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr={t('tabs.pages')} descriptionAr={t('description')} iconName="FileText" />
      <CmsPagesPage embedded initialPanel={initialPanel} />
    </div>
  );
}
