'use client';

import * as React from 'react';
import Link from 'next/link';
import { Warehouse } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Can } from '@/components/shared/can';
import { useWarehouseOperations } from '@/features/inventory/admin/operations/hooks/use-warehouse-operations';
import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';
import {
  WAREHOUSE_OPERATION_KIND_LABELS_AR,
  WAREHOUSE_OPERATION_STATUS_LABELS_AR,
} from '@/features/inventory/domain/constants/warehouse-operation-status';
import { WAREHOUSE_OPERATION_KIND_META } from '@/features/inventory/domain/constants/warehouse-operation-kinds';
import type {
  WarehouseOperation,
  WarehouseOperationStatus,
} from '@/features/inventory/domain/types/warehouse';
import { formatDisplayDate } from '@/shared/utils';

/** Inventory's own permission for listing documents (the API checks it too). */
const OPERATIONS_READ_PERMISSION = 'inv.warehouse.operations.read';

type Props = {
  companyId: string;
  partnerId: string;
};

function statusBadgeVariant(
  status: WarehouseOperationStatus,
): 'subtle' | 'warning' | 'success' | 'destructive' {
  if (status === 'ready') return 'warning';
  if (status === 'done') return 'success';
  if (status === 'cancelled') return 'destructive';
  return 'subtle';
}

function operationHref(operation: WarehouseOperation): string {
  const segment = WAREHOUSE_OPERATION_KIND_META[operation.kind].pathSegment;
  return `${inventoryAdminRoutes.operationsForKind(segment)}?operationId=${encodeURIComponent(operation.id)}`;
}

function PartnerInventoryOperationsBody({ companyId, partnerId }: Props) {
  const { data, isLoading, isError, refetch } = useWarehouseOperations(
    { companyId, partnerId, page: 1, limit: 50, linesMode: 'none' },
    { enabled: Boolean(companyId && partnerId) },
  );
  const operations = data?.items ?? [];

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">جاري تحميل حركات المخزون…</p>;
  }
  if (isError) {
    return (
      <p className="text-sm text-destructive">
        تعذّر تحميل حركات المخزون.{' '}
        <button type="button" className="underline underline-offset-2" onClick={() => void refetch()}>
          أعد المحاولة
        </button>
      </p>
    );
  }
  if (operations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        لا توجد حركات مخزون مرتبطة بهذه الجهة (استلام، صرف، مرتجع).
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {operations.map((operation) => (
        <li key={operation.id}>
          <Link
            href={operationHref(operation)}
            className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-muted/30"
          >
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium text-foreground" dir="ltr">
                {operation.reference}
              </p>
              <p className="text-xs text-muted-foreground">
                {WAREHOUSE_OPERATION_KIND_LABELS_AR[operation.kind]} ·{' '}
                {formatDisplayDate(operation.occurredAt)}
                {operation.sourceDocument ? ` · ${operation.sourceDocument}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {operation.totalQuantity != null ? (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {operation.totalQuantity} وحدة
                </span>
              ) : null}
              <Badge variant={statusBadgeVariant(operation.status)}>
                {WAREHOUSE_OPERATION_STATUS_LABELS_AR[operation.status]}
              </Badge>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * The contact's inventory documents (inventory's part on the contact page,
 * shown only while inventory is enabled — see the tab's `requiresApp`).
 */
export function PartnerInventoryOperationsPanel({ companyId, partnerId }: Props) {
  return (
    <section className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5">
      <header className="mb-4 flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Warehouse className="h-4 w-4" />
        </span>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">حركات المخزون</h2>
          <p className="text-xs text-muted-foreground">
            الاستلام والصرف والمرتجعات التي اختيرت فيها هذه الجهة، من أي مستودع في نطاقك.
          </p>
        </div>
      </header>
      <Can
        permission={OPERATIONS_READ_PERMISSION}
        fallback={<p className="text-sm text-muted-foreground">لا تملك صلاحية عرض مستندات المخزون.</p>}
      >
        <PartnerInventoryOperationsBody companyId={companyId} partnerId={partnerId} />
      </Can>
    </section>
  );
}
