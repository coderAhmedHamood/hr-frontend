'use client';

import * as React from 'react';
import {
  useAccountingDirectoryChrome,
  useDirectoryView,
} from '@/features/accounting/_shared/hooks/use-accounting-directory-chrome';
import {
  EMPTY_ACCOUNTING_DATE_RANGE,
  isAccountingDateInRange,
} from '@/features/accounting/_shared/lib/accounting-date-range';
import type { AccountingWorkspaceConfig } from '@/features/accounting/workspaces/constants/accounting-workspaces';
import { ACCOUNTING_WORKSPACE_ROWS } from '@/features/accounting/workspaces/lib/mock-accounting-workspaces';
import type { AccountingWorkspaceRow } from '@/features/accounting/workspaces/types/accounting-workspace';
import { getTranslations } from '@/shared/i18n/get-translations';

const STATUS_ORDER = ['draft', 'open', 'posted', 'reconciled'] as const;

export function useAccountingWorkspaceModel(config: AccountingWorkspaceConfig) {
  const directory = getTranslations().accounting.directory;
  const copy = directory.workspaces[config.key];
  const common = directory.workspaces.common;
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [category, setCategory] = React.useState('all');
  const [dateRange, setDateRange] = React.useState(EMPTY_ACCOUNTING_DATE_RANGE);
  const [view, setView] = useDirectoryView('table');
  const [selectedRow, setSelectedRow] = React.useState<AccountingWorkspaceRow | null>(null);

  const categories = React.useMemo(
    () => [...new Set(ACCOUNTING_WORKSPACE_ROWS.map((item) => item.category))],
    [],
  );

  const filteredRows = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return ACCOUNTING_WORKSPACE_ROWS.filter((item) => {
      const matchesSearch =
        !term ||
        [item.reference, item.account, item.partner, item.category].some((value) =>
          value.toLowerCase().includes(term),
        );
      return (
        matchesSearch &&
        (status === 'all' || item.status === status) &&
        (category === 'all' || item.category === category) &&
        isAccountingDateInRange(item.date, dateRange)
      );
    });
  }, [category, dateRange, search, status]);

  const statusLabels = React.useMemo(
    () => ({
      draft: directory.statuses.draft,
      open: directory.statuses.open,
      posted: directory.statuses.posted,
      reconciled: directory.statuses.reconciled,
    }),
    [directory.statuses],
  );

  const statusCounts = React.useMemo(
    () => ({
      all: ACCOUNTING_WORKSPACE_ROWS.length,
      draft: ACCOUNTING_WORKSPACE_ROWS.filter((item) => item.status === 'draft').length,
      open: ACCOUNTING_WORKSPACE_ROWS.filter((item) => item.status === 'open').length,
      posted: ACCOUNTING_WORKSPACE_ROWS.filter((item) => item.status === 'posted').length,
      reconciled: ACCOUNTING_WORKSPACE_ROWS.filter((item) => item.status === 'reconciled').length,
    }),
    [],
  );

  const inlineSelects = React.useMemo(
    () => [{
      id: 'category',
      value: category,
      onChange: setCategory,
      placeholder: common.category,
      options: [
        { value: 'all', label: common.allCategories },
        ...categories.map((value) => ({ value, label: value })),
      ],
    }],
    [categories, category, common.allCategories, common.category],
  );

  useAccountingDirectoryChrome({
    title: copy.title,
    description: copy.description,
    iconName: config.iconName,
    search,
    onSearchChange: setSearch,
    searchPlaceholder: common.search,
    inlineSelects,
    dateRange: { value: dateRange, onChange: setDateRange },
    status: {
      value: status,
      onChange: setStatus,
      order: STATUS_ORDER,
      labels: statusLabels,
      counts: statusCounts,
    },
    view,
    onViewChange: setView,
    tableLabel: directory.common.table,
    gridLabel: directory.common.grid,
  });

  return {
    rows: filteredRows,
    view,
    selectedRow,
    setSelectedRow,
    resetDeps: [search, status, category, dateRange.from, dateRange.to],
    copy,
    common,
    directoryCommon: directory.common,
    statusLabels,
  };
}

export type AccountingWorkspaceModel = ReturnType<typeof useAccountingWorkspaceModel>;
