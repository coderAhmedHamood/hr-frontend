'use client';

import * as React from 'react';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import { useJournalEntriesStore } from '@/features/accounting/journal-entries/lib/journal-entries-store';
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
const JOURNAL_OPTIONS = [
  { value: 'all', label: 'كل دفاتر اليومية' },
  { value: 'المبيعات', label: 'المبيعات' },
  { value: 'عمليات متنوعة', label: 'عمليات متنوعة' },
  { value: 'تقسيم المخزون', label: 'تقسيم المخزون' },
  { value: 'المشتريات', label: 'المشتريات' },
  { value: 'البنك', label: 'البنك' },
] as const;

export function useJournalEntriesDirectoryModel() {
  const t = getTranslations().accounting.directory;
  const entries = useJournalEntriesStore((state) => state.entries);
  const deleteEntry = useJournalEntriesStore((state) => state.deleteEntry);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [journalFilter, setJournalFilter] = React.useState('all');
  const [dateRange, setDateRange] = React.useState(EMPTY_ACCOUNTING_DATE_RANGE);
  const [view, setView] = useDirectoryView('table');

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return entries.filter((item) => {
      const matchesSearch =
        !term ||
        [item.name, item.partnerName, item.journalName, item.reference].some((value) =>
          value?.toLowerCase().includes(term),
        );
      return (
        matchesSearch &&
        (status === 'all' || item.state === status) &&
        (journalFilter === 'all' || item.journalName === journalFilter) &&
        isAccountingDateInRange(item.date, dateRange)
      );
    });
  }, [dateRange, entries, journalFilter, search, status]);

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
      all: entries.length,
      draft: entries.filter((item) => item.state === 'draft').length,
      posted: entries.filter((item) => item.state === 'posted').length,
      cancel: entries.filter((item) => item.state === 'cancel').length,
    }),
    [entries],
  );

  const inlineSelects = React.useMemo(
    () => [
      {
        id: 'journal-filter',
        value: journalFilter,
        onChange: setJournalFilter,
        placeholder: 'دفتر اليومية',
        options: JOURNAL_OPTIONS.map((opt) => ({
          value: opt.value,
          label: opt.label,
        })),
      },
    ],
    [journalFilter],
  );

  const router = useAccountingDirectoryChrome({
    title: t.journalEntries.title,
    description: t.journalEntries.description,
    iconName: 'ListOrdered',
    createLabel: t.journalEntries.create,
    createRoute: accountingRoutes.journalEntryNew,
    search,
    onSearchChange: setSearch,
    searchPlaceholder: t.journalEntries.search,
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
    () => [entries.length, search, status, journalFilter, dateRange.from, dateRange.to],
    [entries.length, search, status, journalFilter, dateRange.from, dateRange.to],
  );

  return {
    entries: filtered,
    view,
    router,
    deleteEntry,
    resetDeps,
    t,
  };
}

export type JournalEntriesDirectoryModel = ReturnType<typeof useJournalEntriesDirectoryModel>;
