import type { ListColumnOption } from '@/components/ui/list-columns-picker';
import {
  dateListGroupOptions,
  type ListGroupMeasure,
  type ListGroupOption,
  type ListTotals,
} from '@/components/ui/list-group';
import type { ListSortOption } from '@/components/ui/list-sort';
import type { RegisterExportColumn } from '@/components/pdf/lib/register-export-rows';
import { WAREHOUSE_OPERATION_KIND_META } from '@/features/inventory/domain/constants/warehouse-operation-kinds';
import type { InventoryLedgerEntry } from '@/features/inventory/domain/types/inventory-ledger';
import type { WarehouseOperationKind } from '@/features/inventory/domain/types/warehouse';
import { formatDateTime } from '@/shared/utils';

/**
 * The moves ledger's sort, grouping and columns (list-screens skill). Keys
 * are the server's (`LEDGER_SORT` / `LEDGER_GROUP`).
 */
export const LEDGER_SORT_OPTIONS: readonly ListSortOption[] = [
  { key: 'occurredAt', label: 'التاريخ' },
  { key: 'product', label: 'الصنف' },
  { key: 'quantity', label: 'الكمية' },
  { key: 'reference', label: 'المرجع' },
  { key: 'warehouse', label: 'المستودع' },
  { key: 'kind', label: 'نوع المستند' },
];

export const LEDGER_GROUP_OPTIONS: readonly ListGroupOption[] = [
  { key: 'product', label: 'الصنف' },
  { key: 'warehouse', label: 'المستودع' },
  { key: 'location', label: 'الموقع' },
  {
    key: 'kind',
    label: 'نوع المستند',
    formatKey: (k) => WAREHOUSE_OPERATION_KIND_META[k as WarehouseOperationKind]?.labelAr ?? k,
  },
  { key: 'partner', label: 'الجهة', emptyLabel: 'بدون جهة' },
  ...dateListGroupOptions(),
];

export const LEDGER_GROUP_MEASURES: readonly ListGroupMeasure[] = [
  { key: 'qtyIn', label: 'الوارد' },
  { key: 'qtyOut', label: 'الصادر' },
  { key: 'net', label: 'الصافي' },
];

/** Columns the user may hide (the date, the item and the quantity always show). */
export const LEDGER_COLUMN_OPTIONS: readonly ListColumnOption[] = [
  { key: 'reference', label: 'المرجع' },
  { key: 'warehouse', label: 'المستودع' },
  { key: 'location', label: 'الموقع' },
  { key: 'source', label: 'المصدر' },
];

const qty = (n: number | undefined) =>
  Number(n ?? 0).toLocaleString('en-US', { maximumFractionDigits: 4 });

/** «وارد 30 · صادر 12 · صافي 18» for a group or every filtered movement. */
export function ledgerTotalsLabel(totals: ListTotals): string {
  return `وارد ${qty(totals.sums.qtyIn)} · صادر ${qty(totals.sums.qtyOut)} · صافي ${qty(totals.sums.net)}`;
}

/** The printed / Excel register of movements; `key` ties a column to the screen's. */
export function ledgerExportColumns(names: {
  warehouse: (id: string | undefined) => string;
  location: (id: string | undefined) => string;
}): RegisterExportColumn<InventoryLedgerEntry>[] {
  return [
    { label: 'التاريخ', kind: 'date', value: (e) => formatDateTime(e.occurredAt) },
    { key: 'reference', label: 'المرجع', kind: 'code', value: (e) => e.operationReference },
    {
      key: 'reference',
      label: 'النوع',
      kind: 'status',
      value: (e) => WAREHOUSE_OPERATION_KIND_META[e.kind]?.labelAr ?? e.kind,
    },
    { label: 'الصنف', kind: 'name', value: (e) => e.productName },
    { label: 'الرمز', kind: 'code', value: (e) => e.sku ?? '' },
    { key: 'warehouse', label: 'المستودع', kind: 'text', value: (e) => names.warehouse(e.warehouseId) },
    { key: 'location', label: 'الموقع', kind: 'text', value: (e) => names.location(e.locationId) },
    {
      label: 'الكمية',
      kind: 'number',
      value: (e) => (e.quantityDelta >= 0 ? `+${qty(e.quantityDelta)}` : qty(e.quantityDelta)),
      total: ledgerTotalsLabel,
    },
    { key: 'source', label: 'المصدر', kind: 'text', value: (e) => e.sourceDocument || e.partnerName || '' },
  ];
}
