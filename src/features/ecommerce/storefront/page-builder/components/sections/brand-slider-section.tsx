import type { ResolvedBrandSliderSection } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import { BrandCard } from '@/features/ecommerce/storefront/components/catalog/brand-card';
import { SectionHeader } from '@/features/ecommerce/storefront/components/catalog/section-header';
import { getTranslations } from 'next-intl/server';
import { cn } from '@/shared/utils';

export async function BrandSliderSection({ section }: { section: ResolvedBrandSliderSection }) {
  const brands = section.data.brands;
  if (brands.length === 0) return null;

  const t = await getTranslations('storefront');
  const title = section.heading.title || t('home.featuredBrands');
  const layout = section.style.layout;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title={title}
        subtitle={section.heading.subtitle || undefined}
        viewAllHref={section.content.viewAllHref ?? undefined}
        viewAllLabel={t('home.viewAll')}
      />

      <div
        className={cn(
          layout === 'grid'
            ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
            : 'flex gap-4 overflow-x-auto pb-2 scrollbar-none',
        )}
      >
        {brands.map((brand) => (
          <BrandCard
            key={brand.id}
            brand={brand}
            variant={layout === 'grid' ? 'tile' : 'slider'}
            showLogo={section.settings.showLogo}
          />
        ))}
      </div>
    </section>
  );
}
