'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CmsPagesPage } from '@/features/ecommerce/admin/cms/pages/components/cms-pages-page';
import { BlogCmsPage } from '@/features/ecommerce/admin/cms/blog/components/blog-cms-page';
import { FaqCmsPage } from '@/features/ecommerce/admin/cms/faq/components/faq-cms-page';
import type { EcommerceContentTab } from '@/features/ecommerce/admin/constants/routes';
import { ecommerceContentHref } from '@/features/ecommerce/admin/constants/routes';

const CONTENT_TABS: EcommerceContentTab[] = ['pages', 'blog', 'faq'];

function resolveContentTab(value: string | null): EcommerceContentTab {
  if (value && CONTENT_TABS.includes(value as EcommerceContentTab)) {
    return value as EcommerceContentTab;
  }
  return 'pages';
}

/**
 * Content domain — Pages, Blog, and FAQ live here.
 * Deep-linked via `?tab=` from Website → Content nav items.
 */
export function ContentDomainPage() {
  const t = useTranslations('ecommerceAdmin.content');
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = resolveContentTab(searchParams.get('tab'));

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr={t('title')} iconName="FileText" />

      <Tabs
        value={tab}
        onValueChange={(value) => {
          router.replace(ecommerceContentHref(resolveContentTab(value)));
        }}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="pages">{t('tabs.pages')}</TabsTrigger>
          <TabsTrigger value="blog">{t('tabs.blog')}</TabsTrigger>
          <TabsTrigger value="faq">{t('tabs.faq')}</TabsTrigger>
        </TabsList>
        <TabsContent value="pages" className="mt-4">
          <CmsPagesPage embedded />
        </TabsContent>
        <TabsContent value="blog" className="mt-4">
          <BlogCmsPage embedded />
        </TabsContent>
        <TabsContent value="faq" className="mt-4">
          <FaqCmsPage embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
