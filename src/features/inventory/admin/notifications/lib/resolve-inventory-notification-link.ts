import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';

const SOURCE_KIND_ROUTES: Record<string, string> = {
  inventory_receipt_completed: inventoryAdminRoutes.receipts,
  inventory_issue_completed: inventoryAdminRoutes.deliveries,
  inventory_transfer_completed: inventoryAdminRoutes.transfers,
  inventory_adjustment_posted: inventoryAdminRoutes.adjustments,
  inventory_physical_count_completed: inventoryAdminRoutes.physicalCounts,
  inventory_scrap_posted: inventoryAdminRoutes.scrap,
  inventory_low_stock: inventoryAdminRoutes.reportStock,
  inventory_out_of_stock: inventoryAdminRoutes.reportStock,
  inventory_negative_stock_blocked: inventoryAdminRoutes.pos,
  inventory_sale_stock_deducted: inventoryAdminRoutes.pos,
  inventory_operation_undone: inventoryAdminRoutes.transfers,
};

type NotificationLinkInput = {
  actionUrl?: string | null;
  sourceKind?: string | null;
  sourceTable?: string | null;
  sourceId?: string | null;
};

/** Prefer backend actionUrl; then sourceTable + sourceId; then sourceKind fallback. */
export function resolveInventoryNotificationLink(input: NotificationLinkInput): string | null {
  if (input.actionUrl?.trim()) return input.actionUrl;

  if (input.sourceTable === 'inventory_warehouse_operations' && input.sourceId) {
    const base =
      (input.sourceKind && SOURCE_KIND_ROUTES[input.sourceKind]) ?? inventoryAdminRoutes.transfers;
    return `${base}?operationId=${encodeURIComponent(input.sourceId)}`;
  }

  if (input.sourceTable === 'inventory_products' && input.sourceId) {
    return `${inventoryAdminRoutes.products}?highlight=${encodeURIComponent(input.sourceId)}`;
  }

  if (input.sourceKind && SOURCE_KIND_ROUTES[input.sourceKind]) {
    const base = SOURCE_KIND_ROUTES[input.sourceKind];
    if (input.sourceId) {
      return `${base}?highlight=${encodeURIComponent(input.sourceId)}`;
    }
    return base;
  }

  return null;
}
