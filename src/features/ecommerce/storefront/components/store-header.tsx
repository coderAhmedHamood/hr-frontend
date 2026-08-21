import type {
  StorefrontBrand,
  StorefrontCategory,
  StorefrontCompanyConfig,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import { StoreAnnouncementBar } from '@/features/ecommerce/storefront/components/store-announcement-bar';
import { StoreHeaderInteractive } from '@/features/ecommerce/storefront/components/store-header-client';
import { StoreLogo } from '@/features/ecommerce/storefront/components/store-logo';

type StoreHeaderProps = {
  config: StorefrontCompanyConfig;
  categories: StorefrontCategory[];
  brands: StorefrontBrand[];
};

export function StoreHeader({ config, categories, brands }: StoreHeaderProps) {
  const logo = <StoreLogo name={config.name} logoUrl={config.logoUrl} />;

  return (
    <header className="sticky top-0 z-50 m-0 p-0 shadow-soft">
      <StoreAnnouncementBar announcement={config.announcement} />
      <StoreHeaderInteractive config={config} categories={categories} brands={brands} logo={logo} />
    </header>
  );
}
