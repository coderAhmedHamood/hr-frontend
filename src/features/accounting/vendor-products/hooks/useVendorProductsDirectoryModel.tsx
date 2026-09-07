'use client';

import * as React from 'react';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import { useCustomerProductsStore } from '@/features/accounting/customer-products/lib/customer-products-store';
import {
  useAccountingDirectoryChrome,
  useDirectoryView,
} from '@/features/accounting/_shared/hooks/use-accounting-directory-chrome';
import { getTranslations } from '@/shared/i18n/get-translations';

export function useVendorProductsDirectoryModel() {
  const t = getTranslations().accounting.directory;
  const products = useCustomerProductsStore((state) => state.products);
  const deleteProduct = useCustomerProductsStore((state) => state.deleteProduct);
  const [search, setSearch] = React.useState('');
  const [type, setType] = React.useState('all');
  const [category, setCategory] = React.useState('all');
  const [view, setView] = useDirectoryView('grid');

  const categories = React.useMemo(
    () => [...new Set(products.map((item) => item.category).filter(Boolean))].sort(),
    [products],
  );

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((item) => {
      const matchesSearch =
        !term ||
        [item.name, item.category, item.internalReference, item.barcode].some((value) =>
          value?.toLowerCase().includes(term),
        );
      return (
        matchesSearch &&
        (type === 'all' || item.type === type) &&
        (category === 'all' || item.category === category)
      );
    });
  }, [category, products, search, type]);

  const inlineSelects = React.useMemo(
    () => [
      {
        id: 'type',
        value: type,
        onChange: setType,
        placeholder: t.products.type,
        options: [
          { value: 'all', label: t.products.allTypes },
          { value: 'product', label: t.products.product },
          { value: 'service', label: t.products.service },
          { value: 'consu', label: t.products.consumable },
        ],
      },
      {
        id: 'category',
        value: category,
        onChange: setCategory,
        placeholder: t.products.category,
        options: [
          { value: 'all', label: t.products.allCategories },
          ...categories.map((value) => ({ value, label: value })),
        ],
      },
    ],
    [categories, category, t.products, type],
  );

  const router = useAccountingDirectoryChrome({
    title: t.vendorProducts.title,
    description: t.vendorProducts.description,
    iconName: 'Package',
    createLabel: t.vendorProducts.create,
    createRoute: accountingRoutes.vendorProductNew,
    search,
    onSearchChange: setSearch,
    searchPlaceholder: t.vendorProducts.search,
    inlineSelects,
    view,
    onViewChange: setView,
    tableLabel: t.common.table,
    gridLabel: t.common.grid,
  });

  return {
    products: filtered,
    view,
    router,
    deleteProduct,
    resetDeps: [search, type, category],
    t,
  };
}

export type VendorProductsDirectoryModel = ReturnType<typeof useVendorProductsDirectoryModel>;
