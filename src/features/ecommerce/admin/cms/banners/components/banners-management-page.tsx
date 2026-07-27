'use client';

import * as React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Image as ImageIcon, Images, Pencil, Sparkles } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useHomepagePageRecord } from '@/features/ecommerce/admin/cms/homepage/hooks/use-homepage-page';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import { getSectionDefinition } from '@/features/ecommerce/storefront/page-builder/lib/section-definition-registry';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatTile, StatTileGrid } from '@/components/ui/stat-tile';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import { cn } from '@/shared/utils';

export function BannersManagementPage() {
  const companyId = getStorefrontCompanyId();
  const t = useTranslations('ecommerceAdmin.banners');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { data, isLoading, isError, refetch } = useHomepagePageRecord(companyId);
  const [search, setSearch] = React.useState('');
  const [kindFilter, setKindFilter] = React.useState('all');

  const banners = (data?.sections ?? [])
    .filter((section) => section.type === 'banner' || section.type === 'hero-carousel')
    .sort((a, b) => a.order - b.order);

  const heroCount = banners.filter((section) => section.type === 'hero-carousel').length;
  const bannerCount = banners.filter((section) => section.type === 'banner').length;

  const normalizedSearch = search.trim().toLowerCase();
  const filteredBanners = banners.filter((section) => {
    const definition = getSectionDefinition(section.type);
    const name = locale === 'en' ? definition.displayName.en : definition.displayName.ar;
    const matchesSearch = !normalizedSearch || name.toLowerCase().includes(normalizedSearch);
    const matchesKind = kindFilter === 'all' || section.type === kindFilter;
    return matchesSearch && matchesKind;
  });

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton />
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-2 sm:px-3" asChild>
          <Link href={ecommerceAdminRoutes.homepage}>
            <Pencil className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('editInBuilder')}</span>
          </Link>
        </Button>
      </div>
    ),
    [t],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        leadingFilters={
          <EntityFilterSearchField value={search} onChange={setSearch} placeholder={tCommon('actions.search')} />
        }
        inlineSelects={[
          {
            id: 'kind',
            value: kindFilter,
            onChange: setKindFilter,
            placeholder: tCommon('actions.filter'),
            options: [
              { value: 'all', label: tCommon('actions.filter') },
              { value: 'hero-carousel', label: t('hero') },
              { value: 'banner', label: t('banner') },
            ],
          },
        ]}
      />
    ),
    [search, kindFilter, t, tCommon],
  );

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr={t('title')} descriptionAr={t('description')} iconName="Image" />

      <StatTileGrid className="sm:grid-cols-3">
        <StatTile icon={Images} label={t('title')} value={banners.length} tone="primary" loading={isLoading} />
        <StatTile icon={Sparkles} label={t('hero')} value={heroCount} tone="gold" loading={isLoading} />
        <StatTile icon={ImageIcon} label={t('banner')} value={bannerCount} tone="success" loading={isLoading} />
      </StatTileGrid>

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
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <ImageIcon className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t('empty')}</p>
        </div>
      ) : null}

      {!isLoading && !isError && banners.length > 0 && filteredBanners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <ImageIcon className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t('empty')}</p>
        </div>
      ) : null}

      <ul className="flex flex-col gap-3">
        {filteredBanners.map((section) => {
          const definition = getSectionDefinition(section.type);
          const name = locale === 'en' ? definition.displayName.en : definition.displayName.ar;
          const kindLabel = section.type === 'hero-carousel' ? t('hero') : t('banner');
          const isHero = section.type === 'hero-carousel';
          const slideCount =
            section.type === 'hero-carousel' && 'slides' in section.content
              ? section.content.slides.length
              : null;

          return (
            <li key={section.id}>
              <Card className="rounded-2xl transition-shadow hover:shadow-elevated">
                <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                        isHero ? 'bg-gold/15 text-gold' : 'bg-primary-100 text-primary',
                      )}
                    >
                      {isHero ? <Sparkles className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                    </div>
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <CardTitle className="truncate text-base">{name}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{kindLabel}</Badge>
                        {slideCount !== null ? <span>{t('slideCount', { count: slideCount })}</span> : null}
                        {section.enabled ? null : <Badge variant="subtle">{tCommon('fields.status')}</Badge>}
                      </div>
                    </div>
                  </div>
                  <Button type="button" size="sm" variant="outline" className="shrink-0" asChild>
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
