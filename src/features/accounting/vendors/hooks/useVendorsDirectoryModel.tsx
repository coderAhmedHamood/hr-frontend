'use client';

import * as React from 'react';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import { useVendorsStore } from '@/features/accounting/vendors/lib/vendors-store';
import {
  useAccountingDirectoryChrome,
  useDirectoryView,
} from '@/features/accounting/_shared/hooks/use-accounting-directory-chrome';
import { getTranslations } from '@/shared/i18n/get-translations';

export function useVendorsDirectoryModel() {
  const t = getTranslations().accounting.directory;
  const vendors = useVendorsStore((state) => state.vendors);
  const removeVendor = useVendorsStore((state) => state.removeVendor);
  const [search, setSearch] = React.useState('');
  const [type, setType] = React.useState('all');
  const [country, setCountry] = React.useState('all');
  const [view, setView] = useDirectoryView('table');

  const countries = React.useMemo(
    () => [...new Set(vendors.map((item) => item.country?.trim()).filter(Boolean) as string[])].sort(),
    [vendors],
  );

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return vendors.filter((item) => {
      const matchesSearch =
        !term ||
        [item.name, item.email, item.phone, item.country].some((value) =>
          value?.toLowerCase().includes(term),
        );
      return (
        matchesSearch &&
        (type === 'all' || item.type === type) &&
        (country === 'all' || item.country === country)
      );
    });
  }, [country, search, type, vendors]);

  const inlineSelects = React.useMemo(
    () => [
      {
        id: 'type',
        value: type,
        onChange: setType,
        placeholder: t.vendors.type,
        options: [
          { value: 'all', label: t.vendors.allTypes },
          { value: 'person', label: t.vendors.person },
          { value: 'company', label: t.vendors.company },
        ],
      },
      {
        id: 'country',
        value: country,
        onChange: setCountry,
        placeholder: t.vendors.country,
        options: [
          { value: 'all', label: t.vendors.allCountries },
          ...countries.map((value) => ({ value, label: value })),
        ],
      },
    ],
    [countries, country, t.vendors, type],
  );

  const router = useAccountingDirectoryChrome({
    title: t.vendors.title,
    description: t.vendors.description,
    iconName: 'Building2',
    createLabel: t.vendors.create,
    createRoute: accountingRoutes.vendorNew,
    search,
    onSearchChange: setSearch,
    searchPlaceholder: t.vendors.search,
    inlineSelects,
    view,
    onViewChange: setView,
    tableLabel: t.common.table,
    gridLabel: t.common.grid,
  });

  return {
    vendors: filtered,
    view,
    router,
    removeVendor,
    resetDeps: [search, type, country],
    t,
  };
}

export type VendorsDirectoryModel = ReturnType<typeof useVendorsDirectoryModel>;
