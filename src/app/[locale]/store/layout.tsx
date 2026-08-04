import { StorefrontShell } from '@/features/ecommerce/storefront/components/storefront-shell';
import { StorefrontShellCsr } from '@/features/ecommerce/storefront/components/storefront-shell-csr';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { isStorefrontCsrEnabled } from '@/features/ecommerce/storefront/lib/is-storefront-csr';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  if (isStorefrontCsrEnabled()) {
    return {};
  }
  const config = await getStorefrontCompanyConfig();
  return {
    icons: config.faviconUrl ? { icon: config.faviconUrl } : undefined,
  };
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  if (isStorefrontCsrEnabled()) {
    return <StorefrontShellCsr>{children}</StorefrontShellCsr>;
  }
  return <StorefrontShell>{children}</StorefrontShell>;
}
