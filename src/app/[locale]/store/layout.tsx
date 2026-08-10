import type { Metadata } from 'next';
import { StorefrontShell } from '@/features/ecommerce/storefront/components/storefront-shell';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';

export async function generateMetadata(): Promise<Metadata> {
  const config = await getStorefrontCompanyConfig();
  return {
    icons: config.faviconUrl ? { icon: config.faviconUrl } : undefined,
  };
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <StorefrontShell>{children}</StorefrontShell>;
}
