'use client';

import * as React from 'react';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import { useCustomersStore } from '@/features/accounting/customers/lib/customers-store';
import {
  useAccountingDirectoryChrome,
  useDirectoryView,
} from '@/features/accounting/_shared/hooks/use-accounting-directory-chrome';
import { getTranslations } from '@/shared/i18n/get-translations';

export function useCustomersDirectoryModel() {
  const t = getTranslations().accounting.directory;
  const customers = useCustomersStore((state) => state.customers);
  const removeCustomer = useCustomersStore((state) => state.removeCustomer);
  const [search, setSearch] = React.useState('');
  const [type, setType] = React.useState('all');
  const [country, setCountry] = React.useState('all');
  const [view, setView] = useDirectoryView('table');

  const countries = React.useMemo(
    () => [...new Set(customers.map((item) => item.country?.trim()).filter(Boolean) as string[])].sort(),
    [customers],
  );

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return customers.filter((item) => {
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
  }, [country, customers, search, type]);

  const inlineSelects = React.useMemo(
    () => [
      {
        id: 'type',
        value: type,
        onChange: setType,
        placeholder: t.customers.type,
        options: [
          { value: 'all', label: t.customers.allTypes },
          { value: 'person', label: t.customers.person },
          { value: 'company', label: t.customers.company },
        ],
      },
      {
        id: 'country',
        value: country,
        onChange: setCountry,
        placeholder: t.customers.country,
        options: [
          { value: 'all', label: t.customers.allCountries },
          ...countries.map((value) => ({ value, label: value })),
        ],
      },
    ],
    [countries, country, t.customers, type],
  );

  const router = useAccountingDirectoryChrome({
    title: t.customers.title,
    description: t.customers.description,
    iconName: 'Users',
    createLabel: t.customers.create,
    createRoute: accountingRoutes.customerNew,
    search,
    onSearchChange: setSearch,
    searchPlaceholder: t.customers.search,
    inlineSelects,
    view,
    onViewChange: setView,
    tableLabel: t.common.table,
    gridLabel: t.common.grid,
  });

  return {
    customers: filtered,
    view,
    router,
    removeCustomer,
    resetDeps: [search, type, country],
    t,
  };
}

export type CustomersDirectoryModel = ReturnType<typeof useCustomersDirectoryModel>;
