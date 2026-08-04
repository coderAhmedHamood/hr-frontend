import { createMockRepository } from '@/features/ecommerce/shared/lib/mock/repository';
import { inventoryStockService } from '@/features/inventory/services/inventory-stock.service';
import {
  deriveLineShipStatus,
  validateAllocations,
} from '@/features/ecommerce/admin/orders/lib/allocation-utils';
import type { PaginatedResult } from '@/features/ecommerce/domain/types/common';
import type {
  Order,
  OrderLineAllocation,
  OrderListQuery,
  SaveOrderLineAllocationsInput,
  ShipOrderLineInput,
  UpdateOrderStatusInput,
} from '@/features/ecommerce/domain/types/order';
import ordersSeed from '@/features/ecommerce/shared/lib/mock/orders.json';

const repository = createMockRepository<Order>(ordersSeed as Order[]);

function newAllocId() {
  return `alloc-${Math.random().toString(36).slice(2, 9)}`;
}

function deriveOrderStatus(order: Order): Order['status'] {
  if (order.status === 'cancelled' || order.status === 'refunded' || order.status === 'delivered') {
    return order.status;
  }
  const allShipped = order.items.every((item) => item.shipStatus === 'shipped');
  if (allShipped && order.items.length > 0) return 'shipped';
  const anyProgress = order.items.some(
    (item) => item.shipStatus === 'assigned' || item.shipStatus === 'partial' || item.shipStatus === 'shipped',
  );
  if (anyProgress) return 'processing';
  return order.status === 'confirmed' ? 'confirmed' : 'pending';
}

export const ordersApi = {
  getAll(query: OrderListQuery): Promise<PaginatedResult<Order>> {
    return repository.list(
      query,
      (item, q) => {
        if (q.status && item.status !== q.status) return false;
        if (q.customerId && item.customerId !== q.customerId) return false;
        if (q.search) {
          const search = q.search.toLowerCase();
          return (
            item.orderNumber.toLowerCase().includes(search) ||
            item.customerNameAr.toLowerCase().includes(search) ||
            (item.city?.toLowerCase().includes(search) ?? false)
          );
        }
        return true;
      },
      (a, b) => b.createdAt.localeCompare(a.createdAt),
    );
  },

  getById(companyId: string, id: string) {
    return repository.getById(companyId, id);
  },

  updateStatus(companyId: string, id: string, input: UpdateOrderStatusInput) {
    return repository.update(companyId, id, { ...input, updatedAt: new Date().toISOString() });
  },

  async saveLineAllocations(companyId: string, orderId: string, input: SaveOrderLineAllocationsInput) {
    const order = await repository.getById(companyId, orderId);
    if (!order) throw new Error('الطلب غير موجود.');

    const line = order.items.find((item) => item.productId === input.productId);
    if (!line) throw new Error('بند الطلب غير موجود.');
    if (line.shipStatus === 'shipped') throw new Error('تم شحن هذا البند مسبقًا.');

    const availability = await inventoryStockService.getAvailability(companyId, input.productId);
    const availableByLocation = Object.fromEntries(
      availability.map((row) => [row.locationId, row.availableQuantity]),
    );

    const validation = validateAllocations(line.quantity, input.allocations, availableByLocation);
    if (!validation.ok) throw new Error(validation.error ?? 'توزيع الكمية غير صالح.');

    const allocations: OrderLineAllocation[] = input.allocations.map((row) => ({
      id: newAllocId(),
      warehouseId: row.warehouseId,
      locationId: row.locationId,
      quantity: row.quantity,
    }));

    const items = order.items.map((item) =>
      item.productId === input.productId
        ? {
            ...item,
            allocations,
            shipStatus: deriveLineShipStatus(item.quantity, allocations, false),
          }
        : item,
    );

    const next: Order = {
      ...order,
      items,
      updatedAt: new Date().toISOString(),
    };
    next.status = deriveOrderStatus(next);
    return repository.update(companyId, orderId, next);
  },

  async shipLine(companyId: string, orderId: string, input: ShipOrderLineInput) {
    const order = await repository.getById(companyId, orderId);
    if (!order) throw new Error('الطلب غير موجود.');

    const line = order.items.find((item) => item.productId === input.productId);
    if (!line) throw new Error('بند الطلب غير موجود.');
    if (line.shipStatus === 'shipped') throw new Error('تم شحن هذا البند مسبقًا.');

    const availability = await inventoryStockService.getAvailability(companyId, input.productId);
    const availableByLocation = Object.fromEntries(
      availability.map((row) => [row.locationId, row.availableQuantity]),
    );
    const validation = validateAllocations(line.quantity, line.allocations, availableByLocation);
    if (!validation.ok) throw new Error(validation.error ?? 'احفظ توزيعًا صحيحًا قبل الشحن.');

    await inventoryStockService.issueForShipment({
      companyId,
      productId: input.productId,
      productName: line.productNameAr,
      orderId,
      orderNumber: order.orderNumber,
      lines: line.allocations.map((allocation) => ({
        warehouseId: allocation.warehouseId,
        locationId: allocation.locationId,
        quantity: allocation.quantity,
      })),
    });

    const items = order.items.map((item) =>
      item.productId === input.productId ? { ...item, shipStatus: 'shipped' as const } : item,
    );
    const next: Order = {
      ...order,
      items,
      updatedAt: new Date().toISOString(),
    };
    next.status = deriveOrderStatus(next);
    return repository.update(companyId, orderId, next);
  },
};
