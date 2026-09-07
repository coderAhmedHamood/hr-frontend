'use client';

import * as React from 'react';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import { useCustomerInvoicesStore } from '@/features/accounting/customer-invoices/lib/customer-invoices-store';
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

export function useCustomerInvoicesDirectoryModel() {
  const t = getTranslations().accounting.directory;
  const invoices = useCustomerInvoicesStore((state) => state.invoices);
  const deleteInvoice = useCustomerInvoicesStore((state) => state.deleteInvoice);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [paymentStatus, setPaymentStatus] = React.useState('all');
  const [dateRange, setDateRange] = React.useState(EMPTY_ACCOUNTING_DATE_RANGE);
  const [view, setView] = useDirectoryView('table');

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return invoices.filter((item) => {
      const matchesSearch =
        !term ||
        [item.name, item.customerName, item.journalName, item.salesperson].some((value) =>
          value?.toLowerCase().includes(term),
        );
      return (
        matchesSearch &&
        (status === 'all' || item.state === status) &&
        (paymentStatus === 'all' || item.paymentState === paymentStatus) &&
        isAccountingDateInRange(item.invoiceDate, dateRange)
      );
    });
  }, [dateRange, invoices, paymentStatus, search, status]);

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
      all: invoices.length,
      draft: invoices.filter((item) => item.state === 'draft').length,
      posted: invoices.filter((item) => item.state === 'posted').length,
      cancel: invoices.filter((item) => item.state === 'cancel').length,
    }),
    [invoices],
  );
  const inlineSelects = React.useMemo(
    () => [{
      id: 'payment-status',
      value: paymentStatus,
      onChange: setPaymentStatus,
      placeholder: t.invoices.paymentStatus,
      options: [
        { value: 'all', label: t.common.all },
        ...PAYMENT_STATUS_OPTIONS.map((value) => ({
          value,
          label: t.statuses[value],
        })),
      ],
    }],
    [paymentStatus, t.common.all, t.invoices.paymentStatus, t.statuses],
  );

  const router = useAccountingDirectoryChrome({
    title: t.invoices.title,
    description: t.invoices.description,
    iconName: 'FileText',
    createLabel: t.invoices.create,
    createRoute: accountingRoutes.customerInvoiceNew,
    search,
    onSearchChange: setSearch,
    searchPlaceholder: t.invoices.search,
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
    invoices: filtered,
    view,
    router,
    deleteInvoice,
    resetDeps: [search, status, paymentStatus, dateRange.from, dateRange.to],
    t,
  };
}

export type CustomerInvoicesDirectoryModel = ReturnType<typeof useCustomerInvoicesDirectoryModel>;
