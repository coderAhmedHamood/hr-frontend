/**
 * Inventory feature public surface.
 * Sales / ecommerce should import from here (or services/*) — not from internal mock APIs.
 */
export { inventoryStockService } from '@/features/inventory/services/inventory-stock.service';
export { getInventoryCompanyId } from '@/features/inventory/lib/company-id';
export { warehouseOperationsApi } from '@/features/inventory/admin/operations/lib/api/warehouse-operations';
export { warehousesApi } from '@/features/inventory/admin/warehouses/lib/api/warehouses';
export { warehouseLocationsApi } from '@/features/inventory/admin/locations/lib/api/warehouse-locations';
export { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';
export { isInventoryAdminNavPath } from '@/features/inventory/admin/constants/nav';
