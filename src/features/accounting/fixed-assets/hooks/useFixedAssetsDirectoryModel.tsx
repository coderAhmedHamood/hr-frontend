'use client';

import * as React from 'react';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import { useFixedAssetsStore } from '@/features/accounting/fixed-assets/lib/fixed-assets-store';
import {
  useAccountingDirectoryChrome,
  useDirectoryView,
} from '@/features/accounting/_shared/hooks/use-accounting-directory-chrome';
import {
  EMPTY_ACCOUNTING_DATE_RANGE,
  isAccountingDateInRange,
} from '@/features/accounting/_shared/lib/accounting-date-range';
import { getTranslations } from '@/shared/i18n/get-translations';

const DOCUMENT_STATUS_ORDER = ['draft', 'running', 'cancel'] as const;
const METHOD_OPTIONS = [
  { value: 'all', label: 'كل الطرق' },
  { value: 'خط مستقيم', label: 'خط مستقيم' },
  { value: 'متناقص', label: 'متناقص' },
] as const;

export function useFixedAssetsDirectoryModel() {
  const t = getTranslations().accounting.directory;
  const assets = useFixedAssetsStore((state) => state.assets);
  const deleteAsset = useFixedAssetsStore((state) => state.deleteAsset);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [methodFilter, setMethodFilter] = React.useState('all');
  const [dateRange, setDateRange] = React.useState(EMPTY_ACCOUNTING_DATE_RANGE);
  const [view, setView] = useDirectoryView('table');

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return assets.filter((item) => {
      const matchesSearch =
        !term ||
        [
          item.name,
          item.fixedAssetAccount,
          item.depreciationAccount,
          item.expenseAccount,
          item.method,
        ].some((value) => value?.toLowerCase().includes(term));
      return (
        matchesSearch &&
        (status === 'all' || item.state === status) &&
        (methodFilter === 'all' || item.method === methodFilter) &&
        isAccountingDateInRange(item.acquisitionDate, dateRange)
      );
    });
  }, [assets, dateRange, methodFilter, search, status]);

  const statusLabels = React.useMemo(
    () => ({
      draft: t.statuses.draft,
      running: t.statuses.running,
      cancel: t.statuses.cancel,
    }),
    [t.statuses],
  );

  const statusCounts = React.useMemo(
    () => ({
      all: assets.length,
      draft: assets.filter((item) => item.state === 'draft').length,
      running: assets.filter((item) => item.state === 'running').length,
      cancel: assets.filter((item) => item.state === 'cancel').length,
    }),
    [assets],
  );

  const inlineSelects = React.useMemo(
    () => [
      {
        id: 'method-filter',
        value: methodFilter,
        onChange: setMethodFilter,
        placeholder: 'طريقة الإهلاك',
        options: METHOD_OPTIONS.map((opt) => ({
          value: opt.value,
          label: opt.label,
        })),
      },
    ],
    [methodFilter],
  );

  const router = useAccountingDirectoryChrome({
    title: t.fixedAssets.title,
    description: t.fixedAssets.description,
    iconName: 'Layers',
    createLabel: t.fixedAssets.create,
    createRoute: accountingRoutes.fixedAssetNew,
    search,
    onSearchChange: setSearch,
    searchPlaceholder: t.fixedAssets.search,
    inlineSelects,
    dateRange: { value: dateRange, onChange: setDateRange },
    status: {
      value: status,
      onChange: setStatus,
      order: DOCUMENT_STATUS_ORDER,
      labels: statusLabels,
      counts: statusCounts,
    },
    view,
    onViewChange: setView,
    tableLabel: t.common.table,
    gridLabel: t.common.grid,
  });

  const resetDeps = React.useMemo(
    () => [assets.length, search, status, methodFilter, dateRange.from, dateRange.to],
    [assets.length, search, status, methodFilter, dateRange.from, dateRange.to],
  );

  return {
    assets: filtered,
    view,
    router,
    deleteAsset,
    resetDeps,
    t,
  };
}

export type FixedAssetsDirectoryModel = ReturnType<typeof useFixedAssetsDirectoryModel>;
