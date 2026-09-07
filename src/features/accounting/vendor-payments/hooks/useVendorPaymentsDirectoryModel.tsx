'use client';

import * as React from 'react';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import { useVendorPaymentsStore } from '@/features/accounting/vendor-payments/lib/vendor-payments-store';
import {
  useAccountingDirectoryChrome,
  useDirectoryView,
} from '@/features/accounting/_shared/hooks/use-accounting-directory-chrome';
import {
  EMPTY_ACCOUNTING_DATE_RANGE,
  isAccountingDateInRange,
} from '@/features/accounting/_shared/lib/accounting-date-range';
import { getTranslations } from '@/shared/i18n/get-translations';

const PAYMENT_STATUS_ORDER = ['draft', 'posted', 'in_process', 'cancel'] as const;

export function useVendorPaymentsDirectoryModel() {
  const t = getTranslations().accounting.directory;
  const payments = useVendorPaymentsStore((state) => state.payments);
  const deletePayment = useVendorPaymentsStore((state) => state.deletePayment);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [journal, setJournal] = React.useState('all');
  const [dateRange, setDateRange] = React.useState(EMPTY_ACCOUNTING_DATE_RANGE);
  const [view, setView] = useDirectoryView('table');

  const journals = React.useMemo(
    () => [...new Set(payments.map((item) => item.journalName).filter(Boolean))].sort(),
    [payments],
  );

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((item) => {
      const matchesSearch =
        !term ||
        [item.name, item.partnerName, item.journalName, item.memo].some((value) =>
          value?.toLowerCase().includes(term),
        );
      return (
        matchesSearch &&
        (status === 'all' || item.state === status) &&
        (journal === 'all' || item.journalName === journal) &&
        isAccountingDateInRange(item.paymentDate, dateRange)
      );
    });
  }, [dateRange, journal, payments, search, status]);

  const statusLabels = React.useMemo(
    () => ({
      draft: t.statuses.draft,
      posted: t.statuses.posted,
      in_process: t.statuses.in_process,
      cancel: t.statuses.cancel,
    }),
    [t.statuses],
  );
  const statusCounts = React.useMemo(
    () => ({
      all: payments.length,
      draft: payments.filter((item) => item.state === 'draft').length,
      posted: payments.filter((item) => item.state === 'posted').length,
      in_process: payments.filter((item) => item.state === 'in_process').length,
      cancel: payments.filter((item) => item.state === 'cancel').length,
    }),
    [payments],
  );
  const inlineSelects = React.useMemo(
    () => [{
      id: 'journal',
      value: journal,
      onChange: setJournal,
      placeholder: t.vendorPayments.journal,
      options: [
        { value: 'all', label: t.vendorPayments.allJournals },
        ...journals.map((value) => ({ value, label: value })),
      ],
    }],
    [journal, journals, t.vendorPayments],
  );

  const router = useAccountingDirectoryChrome({
    title: t.vendorPayments.title,
    description: t.vendorPayments.description,
    iconName: 'CreditCard',
    createLabel: t.vendorPayments.create,
    createRoute: accountingRoutes.vendorPaymentNew,
    search,
    onSearchChange: setSearch,
    searchPlaceholder: t.vendorPayments.search,
    inlineSelects,
    dateRange: { value: dateRange, onChange: setDateRange },
    status: {
      value: status,
      onChange: setStatus,
      order: PAYMENT_STATUS_ORDER,
      labels: statusLabels,
      counts: statusCounts,
    },
    view,
    onViewChange: setView,
    tableLabel: t.common.table,
    gridLabel: t.common.grid,
  });

  return {
    payments: filtered,
    view,
    router,
    deletePayment,
    resetDeps: [search, status, journal, dateRange.from, dateRange.to],
    t,
  };
}

export type VendorPaymentsDirectoryModel = ReturnType<typeof useVendorPaymentsDirectoryModel>;
