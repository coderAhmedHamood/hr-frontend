'use client';

import * as React from 'react';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import { useVendorRefundsStore } from '@/features/accounting/vendor-refunds/lib/vendor-refunds-store';
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

export function useVendorRefundsDirectoryModel() {
  const t = getTranslations().accounting.directory;
  const refunds = useVendorRefundsStore((state) => state.refunds);
  const deleteRefund = useVendorRefundsStore((state) => state.deleteRefund);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [paymentStatus, setPaymentStatus] = React.useState('all');
  const [dateRange, setDateRange] = React.useState(EMPTY_ACCOUNTING_DATE_RANGE);
  const [view, setView] = useDirectoryView('table');

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return refunds.filter((item) => {
      const matchesSearch =
        !term ||
        [item.name, item.vendorName, item.originalBillName, item.reason].some((value) =>
          value?.toLowerCase().includes(term),
        );
      return (
        matchesSearch &&
        (status === 'all' || item.state === status) &&
        (paymentStatus === 'all' || item.paymentState === paymentStatus) &&
        isAccountingDateInRange(item.refundDate, dateRange)
      );
    });
  }, [dateRange, paymentStatus, refunds, search, status]);

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
      all: refunds.length,
      draft: refunds.filter((item) => item.state === 'draft').length,
      posted: refunds.filter((item) => item.state === 'posted').length,
      cancel: refunds.filter((item) => item.state === 'cancel').length,
    }),
    [refunds],
  );
  const inlineSelects = React.useMemo(
    () => [{
      id: 'payment-status',
      value: paymentStatus,
      onChange: setPaymentStatus,
      placeholder: t.refunds.paymentStatus,
      options: [
        { value: 'all', label: t.common.all },
        ...PAYMENT_STATUS_OPTIONS.map((value) => ({
          value,
          label: t.statuses[value],
        })),
      ],
    }],
    [paymentStatus, t.common.all, t.refunds.paymentStatus, t.statuses],
  );

  const router = useAccountingDirectoryChrome({
    title: t.refunds.title,
    description: t.refunds.description,
    iconName: 'Receipt',
    createLabel: t.refunds.create,
    createRoute: accountingRoutes.vendorRefundNew,
    search,
    onSearchChange: setSearch,
    searchPlaceholder: t.refunds.search,
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
    refunds: filtered,
    view,
    router,
    deleteRefund,
    resetDeps: [search, status, paymentStatus, dateRange.from, dateRange.to],
    t,
  };
}

export type VendorRefundsDirectoryModel = ReturnType<typeof useVendorRefundsDirectoryModel>;
