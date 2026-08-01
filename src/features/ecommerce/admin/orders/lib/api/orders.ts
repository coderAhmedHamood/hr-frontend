import { createMockRepository } from '@/features/ecommerce/shared/lib/mock/repository';
import {
  listLiveOrders,
  upsertLiveOrder,
} from '@/features/ecommerce/shared/lib/admin-live-commerce';
import { inventoryStockService } from '@/features/inventory/services/inventory-stock.service';
import {
  deriveLineShipStatus,
  validateAllocations,
} from '@/features/ecommerce/admin/orders/lib/allocation-utils';
import { syncStorefrontOrderStatus } from '@/features/ecommerce/storefront/lib/checkout-actions';
import { resolveOrderPaymentMethod } from '@/features/ecommerce/domain/constants/order-status';
import type { PaginatedResult } from '@/features/ecommerce/domain/types/common';
import type {
  Order,
  OrderLineAllocation,
  OrderListQuery,
  SaveOrderLineAllocationsInput,
  ShipOrderLineInput,
  UpdateOrderPaymentStatusInput,
  UpdateOrderStatusInput,
} from '@/features/ecommerce/domain/types/order';
import ordersSeed from '@/features/ecommerce/shared/lib/mock/orders.json';

const repository = createMockRepository<Order>(ordersSeed as Order[]);

function normalizeOrderPayment(order: Order): Order {
  return {
    ...order,
    paymentMethod: resolveOrderPaymentMethod(order),
    paymentStatus: order.paymentStatus ?? 'pending',
  };
}

const hydratedOrderIds = new Set<string>();

async function hydrateLiveOrders(companyId: string): Promise<void> {
  for (const order of listLiveOrders()) {
    if (order.companyId !== companyId) continue;
    if (hydratedOrderIds.has(order.id)) {
      await repository.update(companyId, order.id, order);
      continue;
    }
    const existing = await repository.getById(companyId, order.id);
    if (existing) {
      await repository.update(companyId, order.id, order);
    } else {
      await repository.create(order);
    }
    hydratedOrderIds.add(order.id);
  }
}

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

async function persistOrder(order: Order | null): Promise<Order | null> {
  if (!order) return null;
  if (order.source === 'storefront' || order.orderNumber.startsWith('ND-')) {
    upsertLiveOrder({ ...order, source: order.source ?? 'storefront' });
    try {
      await syncStorefrontOrderStatus({
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      });
    } catch {
      /* storefront sync best-effort in mock mode */
    }
  }
  return order;
}

function orderFulfilmentState(order: Order): 'fulfilled' | 'partial' | 'unfulfilled' {
  if (order.items.length === 0) return 'unfulfilled';
  const shippedCount = order.items.filter((line) => line.shipStatus === 'shipped').length;
  if (shippedCount === order.items.length) return 'fulfilled';
  if (shippedCount === 0) return 'unfulfilled';
  return 'partial';
}

export const ordersApi = {
  async getAll(query: OrderListQuery): Promise<PaginatedResult<Order>> {
    await hydrateLiveOrders(query.companyId);
    const result = await repository.list(
      query,
      (item, q) => {
        const paymentMethod = resolveOrderPaymentMethod(item);
        if (q.status && item.status !== q.status) return false;
        if (q.customerId && item.customerId !== q.customerId) return false;
        if (q.paymentStatus && (item.paymentStatus ?? 'pending') !== q.paymentStatus) return false;
        if (q.paymentMethod && paymentMethod !== q.paymentMethod) {
          return false;
        }
        if (q.source && (item.source ?? 'seed') !== q.source) return false;
        if (q.city && (item.city ?? '') !== q.city) return false;
        if (q.fulfilment) {
          const fulfilment = orderFulfilmentState(item);
          if (fulfilment !== q.fulfilment) return false;
        }
        if (q.search) {
          const search = q.search.toLowerCase();
          return (
            item.orderNumber.toLowerCase().includes(search) ||
            item.customerNameAr.toLowerCase().includes(search) ||
            (item.city?.toLowerCase().includes(search) ?? false) ||
            (item.phone?.toLowerCase().includes(search) ?? false)
          );
        }
        return true;
      },
      (a, b) => b.createdAt.localeCompare(a.createdAt),
    );
    return {
      ...result,
      items: result.items.map(normalizeOrderPayment),
    };
  },

  async getById(companyId: string, id: string) {
    await hydrateLiveOrders(companyId);
    const order = await repository.getById(companyId, id);
    return order ? normalizeOrderPayment(order) : null;
  },

  async updateStatus(companyId: string, id: string, input: UpdateOrderStatusInput) {
    await hydrateLiveOrders(companyId);
    const current = await repository.getById(companyId, id);
    if (!current) throw new Error('الطلب غير موجود.');

    if (
      resolveOrderPaymentMethod(current) === 'card' &&
      current.paymentStatus !== 'paid' &&
      input.status !== 'pending' &&
      input.status !== 'cancelled' &&
      input.status !== 'refunded'
    ) {
      throw new Error('يجب تأكيد دفع الشبكة قبل متابعة مسار الطلب.');
    }

    const patch: Partial<Order> = {
      status: input.status,
      updatedAt: new Date().toISOString(),
    };

    if (input.status === 'shipped' || input.status === 'delivered') {
      patch.items = current.items.map((item) =>
        item.shipStatus === 'shipped' ? item : { ...item, shipStatus: 'shipped' as const },
      );
    }

    const updated = await repository.update(companyId, id, patch);
    return persistOrder(updated);
  },

  async updatePaymentStatus(companyId: string, id: string, input: UpdateOrderPaymentStatusInput) {
    await hydrateLiveOrders(companyId);
    const current = await repository.getById(companyId, id);
    if (!current) throw new Error('الطلب غير موجود.');

    const updated = await repository.update(companyId, id, {
      paymentStatus: input.paymentStatus,
      updatedAt: new Date().toISOString(),
    });
    return persistOrder(updated);
  },

  async saveLineAllocations(companyId: string, orderId: string, input: SaveOrderLineAllocationsInput) {
    await hydrateLiveOrders(companyId);
    const order = await repository.getById(companyId, orderId);
    if (!order) throw new Error('الطلب غير موجود.');

    const line = order.items.find((item) => item.productId === input.productId);
    if (!line) throw new Error('بند الطلب غير موجود.');
    if (line.shipStatus === 'shipped') throw new Error('تم شحن هذا البند مسبقًا.');

    const availability = await inventoryStockService.getAvailability(companyId, input.productId);
    const availableByLocation = Object.fromEntries(
      availability.map((row) => [row.locationId, row.availableQuantity ?? row.quantity]),
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
    return persistOrder(await repository.update(companyId, orderId, next));
  },

  async shipLine(companyId: string, orderId: string, input: ShipOrderLineInput) {
    await hydrateLiveOrders(companyId);
    const order = await repository.getById(companyId, orderId);
    if (!order) throw new Error('الطلب غير موجود.');

    const line = order.items.find((item) => item.productId === input.productId);
    if (!line) throw new Error('بند الطلب غير موجود.');
    if (line.shipStatus === 'shipped') throw new Error('تم شحن هذا البند مسبقًا.');

    const availability = await inventoryStockService.getAvailability(companyId, input.productId);
    const availableByLocation = Object.fromEntries(
      availability.map((row) => [row.locationId, row.availableQuantity ?? row.quantity]),
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
    return persistOrder(await repository.update(companyId, orderId, next));
  },
};
