'use client';

import * as React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Image as ImageIcon, Pencil } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useHomepagePageRecord } from '@/features/ecommerce/admin/cms/homepage/hooks/use-homepage-page';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import { getSectionDefinition } from '@/features/ecommerce/storefront/page-builder/lib/section-definition-registry';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function BannersManagementPage() {
  const companyId = getStorefrontCompanyId();
  const t = useTranslations('ecommerceAdmin.banners');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { data, isLoading, isError, refetch } = useHomepagePageRecord(companyId);

  const banners = (data?.sections ?? [])
    .filter((section) => section.type === 'banner' || section.type === 'hero-carousel')
    .sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr={t('title')} iconName="Image" />

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" asChild>
            <Link href={ecommerceAdminRoutes.homepage}>
              <Pencil className="h-4 w-4" />
              {t('editInBuilder')}
            </Link>
          </Button>
      </div>


      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      ) : null}
      {isError ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-3 py-6">
            <p className="text-sm text-destructive">{t('loadError')}</p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              {tCommon('actions.retry')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <ImageIcon className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t('empty')}</p>
        </div>
      ) : null}

      <ul className="flex flex-col gap-3">
        {banners.map((section) => {
          const definition = getSectionDefinition(section.type);
          const name = locale === 'en' ? definition.displayName.en : definition.displayName.ar;
          const kindLabel = section.type === 'hero-carousel' ? t('hero') : t('banner');
          const slideCount =
            section.type === 'hero-carousel' && 'slides' in section.content
              ? section.content.slides.length
              : null;

          return (
            <li key={section.id}>
              <Card className="transition-shadow hover:shadow-elevated">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                  <div className="flex flex-col gap-1.5">
                    <CardTitle className="text-base">{name}</CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{kindLabel}</Badge>
                      {slideCount !== null ? <span>{t('slideCount', { count: slideCount })}</span> : null}
                      {section.enabled ? null : <Badge variant="subtle">{tCommon('fields.status')}</Badge>}
                    </div>
                  </div>
                  <Button type="button" size="sm" variant="outline" asChild>
                    <Link href={ecommerceAdminRoutes.homepage}>{t('editInBuilder')}</Link>
                  </Button>
                </CardHeader>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
