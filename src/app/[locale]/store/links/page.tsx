import type { Metadata } from 'next';
import { StoreLinksPage, StoreLinksPageCsr } from '@/features/ecommerce/storefront/components/store-links-page';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { isStorefrontCsrEnabled } from '@/features/ecommerce/storefront/lib/is-storefront-csr';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  if (isStorefrontCsrEnabled()) return {};
  const config = await getStorefrontCompanyConfig();
  const description = config.footer.tagline.trim() || config.seo.homeDescription;
  return {
    title: config.name,
    description,
  };
}

export default async function Page() {
  if (isStorefrontCsrEnabled()) return <StoreLinksPageCsr />;
  const config = await getStorefrontCompanyConfig();
  return <StoreLinksPage config={config} />;
}
