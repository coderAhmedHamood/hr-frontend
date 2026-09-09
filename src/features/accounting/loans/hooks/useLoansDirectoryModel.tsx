'use client';

import * as React from 'react';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import { useLoansStore } from '@/features/accounting/loans/lib/loans-store';
import {
  useAccountingDirectoryChrome,
  useDirectoryView,
} from '@/features/accounting/_shared/hooks/use-accounting-directory-chrome';
import {
  EMPTY_ACCOUNTING_DATE_RANGE,
  isAccountingDateInRange,
} from '@/features/accounting/_shared/lib/accounting-date-range';
import { getTranslations } from '@/shared/i18n/get-translations';

const DOCUMENT_STATUS_ORDER = ['draft', 'running', 'closed'] as const;

export function useLoansDirectoryModel() {
  const t = getTranslations().accounting.directory;
  const loans = useLoansStore((state) => state.loans);
  const deleteLoan = useLoansStore((state) => state.deleteLoan);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [dateRange, setDateRange] = React.useState(EMPTY_ACCOUNTING_DATE_RANGE);
  const [view, setView] = useDirectoryView('table');

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return loans.filter((item) => {
      const matchesSearch =
        !term ||
        [item.name, item.longTermAccount, item.shortTermAccount, item.journalName].some((value) =>
          value?.toLowerCase().includes(term),
        );
      return (
        matchesSearch &&
        (status === 'all' || item.state === status) &&
        isAccountingDateInRange(item.loanDate, dateRange)
      );
    });
  }, [dateRange, loans, search, status]);

  const statusLabels = React.useMemo(
    () => ({
      draft: t.statuses.draft,
      running: t.statuses.running,
      closed: t.statuses.closed,
    }),
    [t.statuses],
  );

  const statusCounts = React.useMemo(
    () => ({
      all: loans.length,
      draft: loans.filter((item) => item.state === 'draft').length,
      running: loans.filter((item) => item.state === 'running').length,
      closed: loans.filter((item) => item.state === 'closed').length,
    }),
    [loans],
  );

  const router = useAccountingDirectoryChrome({
    title: t.loans.title,
    description: t.loans.description,
    iconName: 'CreditCard',
    createLabel: t.loans.create,
    createRoute: accountingRoutes.loanNew,
    search,
    onSearchChange: setSearch,
    searchPlaceholder: t.loans.search,
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
    () => [loans.length, search, status, dateRange.from, dateRange.to],
    [loans.length, search, status, dateRange.from, dateRange.to],
  );

  return {
    loans: filtered,
    view,
    router,
    deleteLoan,
    resetDeps,
    t,
  };
}

export type LoansDirectoryModel = ReturnType<typeof useLoansDirectoryModel>;
