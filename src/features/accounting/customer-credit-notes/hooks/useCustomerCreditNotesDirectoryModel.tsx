'use client';

import * as React from 'react';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import { useCustomerCreditNotesStore } from '@/features/accounting/customer-credit-notes/lib/customer-credit-notes-store';
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

export function useCustomerCreditNotesDirectoryModel() {
  const t = getTranslations().accounting.directory;
  const creditNotes = useCustomerCreditNotesStore((state) => state.creditNotes);
  const deleteCreditNote = useCustomerCreditNotesStore((state) => state.deleteCreditNote);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [paymentStatus, setPaymentStatus] = React.useState('all');
  const [dateRange, setDateRange] = React.useState(EMPTY_ACCOUNTING_DATE_RANGE);
  const [view, setView] = useDirectoryView('table');

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return creditNotes.filter((item) => {
      const matchesSearch =
        !term ||
        [item.name, item.customerName, item.originalInvoiceName, item.reason].some((value) =>
          value?.toLowerCase().includes(term),
        );
      return (
        matchesSearch &&
        (status === 'all' || item.state === status) &&
        (paymentStatus === 'all' || item.paymentState === paymentStatus) &&
        isAccountingDateInRange(item.creditNoteDate, dateRange)
      );
    });
  }, [creditNotes, dateRange, paymentStatus, search, status]);

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
      all: creditNotes.length,
      draft: creditNotes.filter((item) => item.state === 'draft').length,
      posted: creditNotes.filter((item) => item.state === 'posted').length,
      cancel: creditNotes.filter((item) => item.state === 'cancel').length,
    }),
    [creditNotes],
  );
  const inlineSelects = React.useMemo(
    () => [{
      id: 'payment-status',
      value: paymentStatus,
      onChange: setPaymentStatus,
      placeholder: t.creditNotes.paymentStatus,
      options: [
        { value: 'all', label: t.common.all },
        ...PAYMENT_STATUS_OPTIONS.map((value) => ({
          value,
          label: t.statuses[value],
        })),
      ],
    }],
    [paymentStatus, t.common.all, t.creditNotes.paymentStatus, t.statuses],
  );

  const router = useAccountingDirectoryChrome({
    title: t.creditNotes.title,
    description: t.creditNotes.description,
    iconName: 'Receipt',
    createLabel: t.creditNotes.create,
    createRoute: accountingRoutes.customerCreditNoteNew,
    search,
    onSearchChange: setSearch,
    searchPlaceholder: t.creditNotes.search,
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
    creditNotes: filtered,
    view,
    router,
    deleteCreditNote,
    resetDeps: [search, status, paymentStatus, dateRange.from, dateRange.to],
    t,
  };
}

export type CustomerCreditNotesDirectoryModel =
  ReturnType<typeof useCustomerCreditNotesDirectoryModel>;
