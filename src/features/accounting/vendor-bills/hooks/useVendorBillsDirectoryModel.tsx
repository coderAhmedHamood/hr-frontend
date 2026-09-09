'use client';

import * as React from 'react';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import { useVendorBillsStore } from '@/features/accounting/vendor-bills/lib/vendor-bills-store';
import {
  useAccountingDirectoryChrome,
  useDirectoryView,
} from '@/features/accounting/_shared/hooks/use-accounting-directory-chrome';
import {
  EMPTY_ACCOUNTING_DATE_RANGE,
  isAccountingDateInRange,
} from '@/features/accounting/_shared/lib/accounting-date-range';
import { getTranslations } from '@/shared/i18n/get-translations';

const DOCUMENT_STATUS_ORDER = ['draft', 'posted', 'cancel'] as const;
const PAYMENT_STATUS_OPTIONS = ['not_paid', 'in_payment', 'paid', 'partial', 'reversed'] as const;

export function useVendorBillsDirectoryModel() {
  const t = getTranslations().accounting.directory;
  const bills = useVendorBillsStore((state) => state.bills);
  const deleteBill = useVendorBillsStore((state) => state.deleteBill);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [paymentStatus, setPaymentStatus] = React.useState('all');
  const [dateRange, setDateRange] = React.useState(EMPTY_ACCOUNTING_DATE_RANGE);
  const [view, setView] = useDirectoryView('table');

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return bills.filter((item) => {
      const matchesSearch =
        !term ||
        [item.name, item.vendorName, item.billReference, item.journalName].some((value) =>
          value?.toLowerCase().includes(term),
        );
      return (
        matchesSearch &&
        (status === 'all' || item.state === status) &&
        (paymentStatus === 'all' || item.paymentState === paymentStatus) &&
        isAccountingDateInRange(item.billDate, dateRange)
      );
    });
  }, [bills, dateRange, paymentStatus, search, status]);

  const statusLabels = React.useMemo(
    () => ({
      draft: t.statuses.draft,
      posted: t.statuses.posted,
      cancel: t.statuses.cancel,
    }),
    [t.statuses],
  );
  const statusCounts = React.useMemo(
    () => ({
      all: bills.length,
      draft: bills.filter((item) => item.state === 'draft').length,
      posted: bills.filter((item) => item.state === 'posted').length,
      cancel: bills.filter((item) => item.state === 'cancel').length,
    }),
    [bills],
  );
  const inlineSelects = React.useMemo(
    () => [{
      id: 'payment-status',
      value: paymentStatus,
      onChange: setPaymentStatus,
      placeholder: t.bills.paymentStatus,
      options: [
        { value: 'all', label: t.common.all },
        ...PAYMENT_STATUS_OPTIONS.map((value) => ({
          value,
          label: t.statuses[value],
        })),
      ],
    }],
    [paymentStatus, t.bills.paymentStatus, t.common.all, t.statuses],
  );

  const router = useAccountingDirectoryChrome({
    title: t.bills.title,
    description: t.bills.description,
    iconName: 'FileText',
    createLabel: t.bills.create,
    createRoute: accountingRoutes.vendorBillNew,
    search,
    onSearchChange: setSearch,
    searchPlaceholder: t.bills.search,
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

  return {
    bills: filtered,
    view,
    router,
    deleteBill,
    resetDeps: [search, status, paymentStatus, dateRange.from, dateRange.to],
    t,
  };
}

export type VendorBillsDirectoryModel = ReturnType<typeof useVendorBillsDirectoryModel>;
