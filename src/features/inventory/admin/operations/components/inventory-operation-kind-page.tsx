'use client';

import { SetPageTitle } from '@/components/layouts/set-page-title';
import { WarehouseOperationsPanel } from '@/features/inventory/admin/operations/components/warehouse-operations-panel';
import { WAREHOUSE_OPERATION_KIND_META } from '@/features/inventory/domain/constants/warehouse-operation-kinds';
import type { WarehouseOperationKind } from '@/features/inventory/domain/types/warehouse';

type Props = {
  kind: WarehouseOperationKind;
};

export function InventoryOperationKindPage({ kind }: Props) {
  const meta = WAREHOUSE_OPERATION_KIND_META[kind];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle
        titleAr={meta.labelAr}
        descriptionAr={`عرض عام لـ${meta.labelAr} عبر كل المستودعات. للعمليات الخاصة بمستودع واحد افتح المستودع من التهيئة. دورة المستند: مسودة ← جاهز ← منتهي.`}
        iconName="Package"
      />

      <WarehouseOperationsPanel kind={kind} enableInventoryFilters />
    </div>
  );
}
