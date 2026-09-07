'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import {
  ListFilterBar,
  type ListFilterInlineSelect,
  type PeriodRange,
} from '@/components/ui/list-filter-bar';

export type AccountingDirectoryView = 'table' | 'grid';

type StatusConfig = {
  value: string;
  onChange: (value: string) => void;
  order: readonly string[];
  labels: Record<string, string>;
  counts: Record<string, number>;
};

type Config = {
  title: string;
  description: string;
  iconName: string;
  createLabel?: string;
  createRoute?: string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  inlineSelects?: readonly ListFilterInlineSelect[];
  status?: StatusConfig;
  dateRange?: {
    value: PeriodRange;
    onChange: (value: PeriodRange) => void;
  };
  view: AccountingDirectoryView;
  onViewChange: (view: AccountingDirectoryView) => void;
  tableLabel: string;
  gridLabel: string;
};

export function useAccountingDirectoryChrome(config: Config) {
  const router = useRouter();

  useSetPageTitle({
    titleAr: config.title,
    descriptionAr: config.description,
    iconName: config.iconName,
  });

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton />
        {config.createLabel && config.createRoute ? (
          <PageHeaderPrimaryButton
            icon={Plus}
            label={config.createLabel}
            onClick={() => router.push(config.createRoute!)}
          />
        ) : null}
      </div>
    ),
    [config.createLabel, config.createRoute, router],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showDateSection={Boolean(config.dateRange)}
        optionalDateRange
        periodValue={config.dateRange?.value}
        onPeriodChange={config.dateRange?.onChange}
        showStatusSection={Boolean(config.status)}
        showEmployeePicker={false}
        leadingFilters={
          <EntityFilterSearchField
            value={config.search}
            onChange={config.onSearchChange}
            placeholder={config.searchPlaceholder}
          />
        }
        inlineSelects={config.inlineSelects}
        statusFilter={config.status?.value}
        onStatusFilterChange={config.status?.onChange}
        statusOrder={config.status?.order}
        statusLabels={config.status?.labels}
        statusCounts={config.status?.counts}
        dataView={{
          value: config.view,
          onChange: (value) => config.onViewChange(value as AccountingDirectoryView),
          options: [
            { value: 'table', label: config.tableLabel, icon: 'list' },
            { value: 'grid', label: config.gridLabel, icon: 'layout-grid' },
          ],
        }}
      />
    ),
    [
      config.search,
      config.onSearchChange,
      config.inlineSelects,
      config.status?.value,
      config.status?.onChange,
      config.status?.order,
      config.status?.labels,
      config.status?.counts,
      config.dateRange?.value,
      config.dateRange?.onChange,
      config.view,
      config.onViewChange,
      config.searchPlaceholder,
      config.tableLabel,
      config.gridLabel,
    ],
  );

  return router;
}

export function useDirectoryView(defaultView: AccountingDirectoryView) {
  return React.useState<AccountingDirectoryView>(defaultView);
}
