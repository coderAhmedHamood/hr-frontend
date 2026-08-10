import type { Metadata } from 'next';
import { StoreWishlistPage } from '@/features/ecommerce/storefront/components/store-wishlist-page';
import { wishlistMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import type { StorefrontLocale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = await getStorefrontCompanyConfig();
  return wishlistMetadata(config, locale as StorefrontLocale);
}

export default function Page() {
  return <StoreWishlistPage />;
}
