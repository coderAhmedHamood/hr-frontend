'use client';

import { useTranslations } from 'next-intl';
import { Package, ShoppingCart, Users } from 'lucide-react';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useProducts } from '@/features/ecommerce/admin/products/hooks/use-products';
import { useOrders } from '@/features/ecommerce/admin/orders/hooks/use-orders';
import { useCustomers } from '@/features/ecommerce/admin/customers/hooks/use-customers';
import { StatTile, StatTileGrid } from '@/components/ui/stat-tile';
import { SetPageTitle } from '@/components/layouts/set-page-title';

export function EcommerceOverviewPage() {
  const t = useTranslations('ecommerceAdmin');
  const companyId = useAuthStore((s) => s.activeCompanyId) ?? '';
  const products = useProducts({ companyId });
  const orders = useOrders({ companyId });
  const customers = useCustomers({ companyId });

  const stats = [
    { label: t('nav.products'), value: products.data?.pagination.total ?? 0, icon: Package, tone: 'primary' as const, loading: products.isLoading },
    { label: t('nav.orders'), value: orders.data?.pagination.total ?? 0, icon: ShoppingCart, tone: 'gold' as const, loading: orders.isLoading },
    { label: t('nav.customers'), value: customers.data?.pagination.total ?? 0, icon: Users, tone: 'success' as const, loading: customers.isLoading },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr={t('nav.overview')} iconName="LayoutDashboard" />

      <StatTileGrid>
        {stats.map((stat) => (
          <StatTile key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} tone={stat.tone} loading={stat.loading} />
        ))}
      </StatTileGrid>
    </div>
  );
}
