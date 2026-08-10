'use client';

import { SetPageTitle } from '@/components/layouts/set-page-title';
import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeftRight,
  ArrowRight,
  ClipboardList,
  Factory,
  MapPin,
  PackageMinus,
  PackagePlus,
  RefreshCw,
  ShoppingCart,
  SlidersHorizontal,
  Truck,
} from 'lucide-react';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';
import { useWarehouse } from '@/features/inventory/admin/warehouses/hooks/use-warehouses';
import { WarehouseOperationsPanel } from '@/features/inventory/admin/operations/components/warehouse-operations-panel';
import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';
import {
  isWarehouseOperationKind,
  WAREHOUSE_DETAIL_TAB_KINDS,
  WAREHOUSE_OPERATION_KIND_META,
} from '@/features/inventory/domain/constants/warehouse-operation-kinds';
import type { WarehouseOperationKind } from '@/features/inventory/domain/types/warehouse';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';

const TAB_ICONS: Record<WarehouseOperationKind, React.ComponentType<{ className?: string }>> = {
  transfer: Truck,
  receipt: PackagePlus,
  issue: PackageMinus,
  internal: ArrowLeftRight,
  adjustment: SlidersHorizontal,
  physical_count: ClipboardList,
  scrap: Factory,
  purchase: ShoppingCart,
  replenishment: RefreshCw,
};

export function WarehouseDetailPage() {
  const companyId = getInventoryCompanyId();
  const router = useRouter();
  const params = useParams<{ warehouseId: string }>();
  const searchParams = useSearchParams();
  const warehouseId = params.warehouseId;

  const tabParam = searchParams.get('tab');
  const activeTab: WarehouseOperationKind =
    isWarehouseOperationKind(tabParam) && WAREHOUSE_DETAIL_TAB_KINDS.includes(tabParam)
      ? tabParam
      : 'receipt';

  const { data: warehouse, isLoading, isError } = useWarehouse(companyId, warehouseId);

  const setTab = (tab: WarehouseOperationKind) => {
    router.replace(`${inventoryAdminRoutes.warehouseDetail(warehouseId)}?tab=${tab}`, { scroll: false });
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">جاري تحميل المستودع…</p>;
  }

  if (isError || !warehouse) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-destructive">تعذر العثور على المستودع.</p>
        <Button variant="outline" onClick={() => router.push(inventoryAdminRoutes.warehouses)}>
          العودة للمخازن
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr={warehouse.nameAr} iconName="Warehouse" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-soft">
          <span className="font-medium text-foreground" dir="ltr">
            {warehouse.code}
          </span>
          {warehouse.address ? <span className="mx-2">·</span> : null}
          {warehouse.address}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={warehouse.status === 'active' ? 'success' : 'subtle'}>
            {warehouse.status === 'active' ? 'نشط' : 'غير نشط'}
          </Badge>
          <Button
            variant="outline"
            onClick={() => router.push(inventoryAdminRoutes.locationsForWarehouse(warehouseId))}
          >
            <MapPin className="h-4 w-4" />
            المواقع
          </Button>
          <Button variant="outline" onClick={() => router.push(inventoryAdminRoutes.warehouses)}>
            <ArrowRight className="h-4 w-4" />
            كل المستودعات
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border pb-px">
        {WAREHOUSE_DETAIL_TAB_KINDS.map((kind) => {
          const Icon = TAB_ICONS[kind];
          const selected = activeTab === kind;
          const both = WAREHOUSE_OPERATION_KIND_META[kind].uiPlacement === 'both';
          return (
            <button
              key={kind}
              type="button"
              onClick={() => setTab(kind)}
              title={both ? 'متاح أيضًا من قائمة عمليات المخزون' : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-t-lg px-2.5 py-2 text-xs sm:text-sm transition-colors',
                selected
                  ? 'border-b-2 border-primary font-semibold text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {WAREHOUSE_OPERATION_KIND_META[kind].labelAr}
            </button>
          );
        })}
      </div>

      <WarehouseOperationsPanel warehouseId={warehouseId} kind={activeTab} />
    </div>
  );
}
