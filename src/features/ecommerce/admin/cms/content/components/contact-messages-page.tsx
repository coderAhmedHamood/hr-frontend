'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MessageSquareWarning, Lightbulb } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { listCmsContactMessages } from '@/features/ecommerce/admin/cms/shared/cms-actions';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import type { StoreContactMessageDto, StoreContactMessageType } from '@/features/ecommerce/shared/lib/api/store-content-api';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DisplayDate } from '@/components/ui/table-cells';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
import { GroupedDataTable } from '@/components/ui/grouped-data-table';
import { ListColumnsPicker, useColumnVisibility, type ListColumnOption } from '@/components/ui/list-columns-picker';
import {
  dateListGroupOptions,
  ListGroupMenu,
  listGroupQuery,
  useGroupedList,
  useListGroup,
  type ListGroupOption,
} from '@/components/ui/list-group';
import { ListSavedViews, listStateKeys } from '@/components/ui/list-saved-views';
import { ListSortMenu, listSortQuery, useListSort, type ListSortOption } from '@/components/ui/list-sort';
import { RegisterExportMenu } from '@/components/pdf/register-export-menu';
import {
  registerExportRows,
  visibleExportColumns,
  type RegisterExportColumn,
} from '@/components/pdf/lib/register-export-rows';
import { fetchAllPaginatedItems } from '@/shared/api/client';
import { formatDateTime } from '@/shared/utils';
import { hrFiltersKey, usePersistedFilterState } from '@/features/hr/lib/use-persisted-filter-state';
import {
  fetchAdminContactMessageGroups,
  fetchAdminContactMessages,
} from '@/features/ecommerce/shared/lib/api/store-content-api';

const PAGE_SIZE = 20;

/** Server keys (list-screens skill). */
const MESSAGES_SORT_OPTIONS: readonly ListSortOption[] = [
  { key: 'createdAt', label: 'التاريخ' },
  { key: 'name', label: 'الاسم' },
  { key: 'type', label: 'النوع' },
];

const MESSAGES_GROUP_OPTIONS: readonly ListGroupOption[] = [
  { key: 'type', label: 'النوع', formatKey: (k) => TYPE_LABEL[k as StoreContactMessageType] ?? k },
  ...dateListGroupOptions(),
];

const MESSAGES_COLUMN_OPTIONS: readonly ListColumnOption[] = [{ key: 'message', label: 'الرسالة' }];

const MESSAGES_EXPORT_COLUMNS: RegisterExportColumn<StoreContactMessageDto>[] = [
  { label: 'الاسم', kind: 'name', value: (m) => m.name },
  { label: 'التواصل', kind: 'code', value: (m) => [m.email, m.phone].filter(Boolean).join(' · ') },
  { label: 'النوع', kind: 'status', value: (m) => TYPE_LABEL[m.type] ?? m.type },
  { key: 'message', label: 'الرسالة', kind: 'text', value: (m) => m.message },
  { label: 'التاريخ', kind: 'date', value: (m) => formatDateTime(m.createdAt) },
];

const TYPE_LABEL: Record<StoreContactMessageType, string> = {
  complaint: 'شكوى',
  suggestion: 'مقترح',
};

const TYPE_BADGE: Record<StoreContactMessageType, { variant: 'destructive' | 'success'; icon: typeof MessageSquareWarning }> = {
  complaint: { variant: 'destructive', icon: MessageSquareWarning },
  suggestion: { variant: 'success', icon: Lightbulb },
};

function TypeBadge({ type }: { type: StoreContactMessageType }) {
  const { variant, icon: Icon } = TYPE_BADGE[type];
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {TYPE_LABEL[type]}
    </Badge>
  );
}

export function ContactMessagesPage() {
  const companyId = getStorefrontCompanyId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight')?.trim() ?? '';
  const [page, setPage] = React.useState(1);
  // Filters, sort, grouping and columns: kept per user and company.
  const filterKey = (field: string) => hrFiltersKey('store', 'contact-messages', companyId, field);
  const [type, setType] = usePersistedFilterState<'all' | StoreContactMessageType>(filterKey('type'), 'all');
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [dateFrom, setDateFrom] = usePersistedFilterState(filterKey('dateFrom'), '');
  const [dateTo, setDateTo] = usePersistedFilterState(filterKey('dateTo'), '');
  const stateKeys = listStateKeys('store', 'contact-messages', companyId);
  const sort = useListSort(stateKeys.sort, MESSAGES_SORT_OPTIONS);
  const group = useListGroup(stateKeys.group, MESSAGES_GROUP_OPTIONS);
  const groupBy = group.groupBy;
  const columnVisibility = useColumnVisibility(filterKey('hiddenColumns'), MESSAGES_COLUMN_OPTIONS);
  const sortQuery = listSortQuery(sort.sort);
  React.useEffect(() => setPage(1), [sort.sortKey]);
  const [viewing, setViewing] = React.useState<StoreContactMessageDto | null>(null);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const filters = {
    type: type === 'all' ? undefined : type,
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };
  const query = { ...filters, ...sortQuery, page, limit: PAGE_SIZE };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['cms', 'contact-messages', companyId, query],
    queryFn: () => listCmsContactMessages(companyId, query),
    enabled: !groupBy,
  });
  const grouped = useGroupedList<StoreContactMessageDto>({
    enabled: Boolean(companyId) && Boolean(groupBy),
    groupBy,
    resetKey: JSON.stringify({ ...filters, ...sortQuery }),
    fetchGroups: () => fetchAdminContactMessageGroups(companyId, { ...filters, ...listGroupQuery(groupBy) }),
    fetchGroupRows: (groupValue, p, l) =>
      fetchAdminContactMessages(companyId, {
        ...filters,
        ...sortQuery,
        ...listGroupQuery(groupBy),
        groupValue,
        page: p,
        limit: l,
      }),
  });

  const exportColumns = visibleExportColumns(MESSAGES_EXPORT_COLUMNS, columnVisibility.isVisible);
  const filterSummary = [
    search ? `بحث: ${search}` : null,
    type !== 'all' ? `النوع: ${TYPE_LABEL[type]}` : null,
    dateFrom || dateTo ? `الفترة: ${dateFrom || '…'} — ${dateTo || '…'}` : null,
    sort.label,
    group.label,
  ].filter((line): line is string => Boolean(line));

  /** Every filtered message (all pages) in the screen's order, grouped like the screen. */
  const getExportRows = async () => {
    const all = { ...filters, ...sortQuery, ...listGroupQuery(groupBy) };
    const [{ items }, summary] = await Promise.all([
      fetchAllPaginatedItems((p, l) => fetchAdminContactMessages(companyId, { ...all, page: p, limit: l })),
      groupBy ? fetchAdminContactMessageGroups(companyId, all) : Promise.resolve(null),
    ]);
    return registerExportRows({
      columns: exportColumns,
      rows: items,
      grouping:
        groupBy && group.option && summary
          ? {
              fieldLabel: group.option.label,
              groups: group.sortGroups(summary.groups),
              labelOf: group.labelOf,
              groupKeyOf: (message) => message.groupKey,
            }
          : undefined,
    });
  };

  const highlightHandledRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!highlightId || isLoading) return;
    if (highlightHandledRef.current === highlightId) return;

    const match = (data?.items ?? []).find((row) => row.id === highlightId);
    if (match) {
      highlightHandledRef.current = highlightId;
      setViewing(match);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('highlight');
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
      return;
    }

    const totalPages = data?.pagination?.totalPages ?? 1;
    if (page < totalPages) {
      setPage((current) => current + 1);
    } else {
      highlightHandledRef.current = highlightId;
    }
  }, [
    highlightId,
    isLoading,
    data?.items,
    data?.pagination?.totalPages,
    page,
    pathname,
    router,
    searchParams,
  ]);

  const hasActiveFilters = type !== 'all' || Boolean(search) || Boolean(dateFrom) || Boolean(dateTo);

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton activeFilterCount={(type !== 'all' ? 1 : 0) + (dateFrom || dateTo ? 1 : 0)} />
        <ListColumnsPicker model={columnVisibility} />
        <ListSortMenu model={sort} />
        <ListGroupMenu model={group} />
        <ListSavedViews storageKey={stateKeys.views} prefixes={stateKeys.prefixes} />
        <RegisterExportMenu
          title="سجل الشكاوى والمقترحات"
          fileName="contact-messages"
          columns={exportColumns}
          getRows={getExportRows}
          subtitleLines={filterSummary}
          landscape
          emptyMessage="لا توجد رسائل للتصدير ضمن الفلاتر الحالية."
        />
      </div>
    ),
    [
      type,
      dateFrom,
      dateTo,
      search,
      sort.sortKey,
      sort.label,
      group.groupKey,
      group.label,
      columnVisibility.hiddenKey,
      stateKeys.views,
    ],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showStatusSection={false}
        showEmployeePicker={false}
        showDateSection
        optionalDateRange
        periodValue={{ from: dateFrom, to: dateTo }}
        onPeriodChange={({ from, to }) => {
          setDateFrom(from);
          setDateTo(to);
          setPage(1);
        }}
        leadingFilters={
          <EntityFilterSearchField
            value={searchInput}
            onChange={setSearchInput}
            placeholder="بحث بالاسم أو البريد أو الجوال أو نص الرسالة…"
          />
        }
        inlineSelects={[
          {
            id: 'type',
            value: type,
            onChange: (value) => {
              setType(value as typeof type);
              setPage(1);
            },
            placeholder: 'كل الأنواع',
            options: [
              { value: 'all', label: 'كل الأنواع' },
              { value: 'complaint', label: 'شكوى' },
              { value: 'suggestion', label: 'مقترح' },
            ],
          },
        ]}
      />
    ),
    [dateFrom, dateTo, searchInput, type],
  );

  const allColumns: ColumnDef<StoreContactMessageDto>[] = [
    {
      key: 'name',
      title: 'الاسم',
      sortKey: 'name',
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
            {[row.email, row.phone].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      title: 'النوع',
      sortKey: 'type',
      render: (row) => <TypeBadge type={row.type} />,
    },
    {
      key: 'message',
      title: 'الرسالة',
      hideOnMobile: true,
      render: (row) => (
        <p className="max-w-md truncate text-sm text-foreground">{row.message}</p>
      ),
    },
    {
      key: 'createdAt',
      title: 'التاريخ',
      sortKey: 'createdAt',
      render: (row) => <DisplayDate value={row.createdAt} mode="datetime" />,
    },
  ];
  const columns = allColumns.filter((col) => columnVisibility.isVisible(col.key));

  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle
        titleAr="الشكاوى والمقترحات"
        descriptionAr="شكاوى ومقترحات العملاء الواردة من المتجر."
        iconName="Mail"
      />

      {isError ? (
        <div className="rounded-xl border border-destructive/30 bg-card p-4 text-sm">
          <p className="text-destructive">تعذر تحميل الشكاوى والمقترحات.</p>
          <button type="button" className="mt-2 text-primary underline" onClick={() => refetch()}>
            إعادة المحاولة
          </button>
        </div>
      ) : groupBy ? (
        <GroupedDataTable
          columns={columns}
          group={group}
          list={grouped}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => setViewing(row)}
          sort={sort.sort}
          onSort={sort.toggle}
          emptyText="لا توجد نتائج مطابقة للفلاتر."
        />
      ) : (
        <DataTable
          variant="directory"
          className="sto-table-host"
          columns={columns}
          sort={sort.sort}
          onSort={sort.toggle}
          data={data?.items ?? []}
          keyExtractor={(row) => row.id}
          loading={isLoading}
          emptyText={hasActiveFilters ? 'لا توجد نتائج مطابقة للفلاتر.' : 'لا توجد شكاوى أو مقترحات بعد.'}
          onRowClick={(row) => setViewing(row)}
          mobileCard={(row) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{row.name}</p>
                  <p className="truncate text-xs text-muted-foreground" dir="ltr">
                    {[row.email, row.phone].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <TypeBadge type={row.type} />
              </div>
              <p className="line-clamp-3 text-sm text-foreground">{row.message}</p>
            </div>
          )}
        />
      )}

      {total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            عرض {from}–{to} من {total}
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              السابق
            </Button>
            <span className="text-xs">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              التالي
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={viewing != null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewing ? <TypeBadge type={viewing.type} /> : null}
              {viewing?.name}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <p className="text-xs text-muted-foreground" dir="ltr">
              {[viewing?.email, viewing?.phone].filter(Boolean).join(' · ') || '—'}
            </p>
            {viewing ? <DisplayDate value={viewing.createdAt} mode="datetime" /> : null}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {viewing?.message}
            </p>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
