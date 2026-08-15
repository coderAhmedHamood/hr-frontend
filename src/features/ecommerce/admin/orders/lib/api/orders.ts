import { resolveOrderPaymentMethod } from '@/features/ecommerce/domain/constants/order-status';
import type { PaginatedResult } from '@/features/ecommerce/domain/types/common';
import type {
  CreateStoreOrderAttachmentInput,
  Order,
  OrderLineItem,
  OrderListQuery,
  OrderStatus,
  SaveOrderLineAllocationsInput,
  ShipOrderLineInput,
  UpdateOrderLineShipStatusInput,
  UpdateOrderPaymentStatusInput,
  UpdateOrderStaffNoteInput,
  UpdateOrderStatusInput,
  UpdateStoreOrderAttachmentInput,
} from '@/features/ecommerce/domain/types/order';
import {
  addAdminStoreOrderAttachment,
  deleteAdminStoreOrderAttachment,
  updateAdminStoreOrderAttachment,
  fetchAdminStoreOrder,
  fetchAdminStoreOrders,
  saveAdminStoreLineAllocations,
  shipAdminStoreLine,
  storeOrdersHttpEnabled,
  updateAdminStoreLineShipStatus,
  updateAdminStoreOrderPayment,
  updateAdminStoreOrderStaffNote,
  updateAdminStoreOrderStatus,
} from '@/features/ecommerce/shared/lib/api/store-orders-api';
import { inventoryLedgerApi } from '@/features/inventory/admin/operations/lib/api/inventory-ledger';
import {
  type SaleStockLineInput,
  type SaleStockDeductResult,
} from '@/features/inventory/admin/stock/lib/api/sale-stock-api';
import { inventoryStockService } from '@/features/inventory/services/inventory-stock.service';
import { toast } from 'sonner';

/**
 * Stock for store admin (manual deduct — place-order does not deduct):
 * - deduct: status → shipped → POST /inventory/stock/sale-deduct (sourceDocument = orderNumber)
 * - restore: status → cancelled | refunded is automatic on the backend (do not call sale-restore)
 */
const STOCK_DEDUCT_STATUS: OrderStatus = 'shipped';
const RESTORE_STATUSES: OrderStatus[] = ['cancelled', 'refunded'];

function normalizeOrderPayment(order: Order): Order {
  return {
    ...order,
    paymentMethod: resolveOrderPaymentMethod(order),
    paymentStatus: order.paymentStatus ?? 'pending',
  };
}

function assertStoreHttp(): void {
  if (!storeOrdersHttpEnabled()) {
    throw new Error('STORE_HTTP_DISABLED');
  }
}

function summarizeSaleLines(result: SaleStockDeductResult): string {
  const ref = result.operationReference ?? '—';
  const counts = result.lines.reduce(
    (acc, line) => {
      acc[line.status] = (acc[line.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const parts = Object.entries(counts).map(([status, count]) => `${status}:${count}`);
  return `${ref} · ${parts.join(' · ') || 'لا بنود'}`;
}

/** Ledger issue rows for this order — used to recover variantId / location on restore. */
async function listOrderSaleDeductEntries(companyId: string, orderNumber: string, productId: string) {
  const page = await inventoryLedgerApi.list({
    companyId,
    productId,
    search: orderNumber,
    page: 1,
    limit: 100,
  });
  return page.items.filter(
    (entry) =>
      entry.sourceDocument === orderNumber &&
      entry.productId === productId &&
      entry.quantityDelta < 0,
  );
}

/**
 * Backend requires variantId when the product has variants.
 * Prefer the order line value; else recover from the prior sale-deduct ledger row.
 */
async function ensureSaleLinesVariantIds(
  companyId: string,
  orderNumber: string,
  lines: SaleStockLineInput[],
): Promise<SaleStockLineInput[]> {
  const resolved: SaleStockLineInput[] = [];
  const consumedLedgerIds = new Set<string>();

  for (const line of lines) {
    if (line.variantId) {
      resolved.push(line);
      continue;
    }

    const deducts = await listOrderSaleDeductEntries(companyId, orderNumber, line.productId);
    const match =
      deducts.find(
        (entry) =>
          Boolean(entry.variantId) &&
          !consumedLedgerIds.has(entry.id) &&
          Math.abs(entry.quantityDelta) === line.quantity,
      ) ??
      deducts.find((entry) => Boolean(entry.variantId) && !consumedLedgerIds.has(entry.id));

    if (match?.variantId) {
      consumedLedgerIds.add(match.id);
      resolved.push({ ...line, variantId: match.variantId });
      continue;
    }

    const { byVariant } = await inventoryStockService.getOnHandByVariant(companyId, line.productId);
    const hasVariants = Object.keys(byVariant).some((key) => key !== '');
    if (hasVariants) {
      throw new Error(
        `المنتج يتطلب variantId لخصم/إرجاع المخزون، لكن بند الطلب لا يحتوي متغيرًا. رقم الطلب: ${orderNumber}`,
      );
    }

    resolved.push({ ...line, variantId: null });
  }

  return resolved;
}

/** True if a prior sale deduct already posted for this order number. */
async function orderAlreadyDeducted(companyId: string, order: Order): Promise<boolean> {
  const productIds = [...new Set(order.items.map((item) => item.productId).filter(Boolean))];
  for (const productId of productIds) {
    const deducts = await listOrderSaleDeductEntries(companyId, order.orderNumber, productId);
    if (deducts.length > 0) return true;
  }
  return false;
}

/**
 * One deduct request: allocations become per-line locationId; otherwise omit location
 * so the backend deducts from the product warehouse.
 */
function buildDeductLines(order: Order): SaleStockLineInput[] {
  const lines: SaleStockLineInput[] = [];

  for (const item of order.items) {
    if (item.quantity <= 0 || !item.productId) continue;

    const allocs = item.allocations.filter((row) => row.quantity > 0 && row.locationId);
    if (allocs.length === 0) {
      lines.push({
        productId: item.productId,
        variantId: item.variantId?.trim() || null,
        quantity: item.quantity,
      });
      continue;
    }

    for (const row of allocs) {
      lines.push({
        productId: item.productId,
        variantId: item.variantId?.trim() || null,
        quantity: row.quantity,
        locationId: row.locationId,
      });
    }
  }

  return lines;
}

function resolveOrderLine(
  order: Order,
  input: { productId: string; lineId?: string },
): OrderLineItem {
  const line = input.lineId
    ? order.items.find((item) => item.lineId === input.lineId)
    : order.items.find((item) => item.productId === input.productId);
  if (!line) throw new Error('بند الطلب غير موجود.');
  if (!line.lineId) {
    throw new Error('معرّف بند الطلب غير متوفر. حدّث الصفحة ثم أعد المحاولة.');
  }
  return line;
}

/** Admin orders — HTTP only (store-frontend-binding.md). No mock / localStorage. */
export const ordersApi = {
  /** List page only (no per-row detail fetch). Use for partner panels / filters. */
  async list(query: OrderListQuery): Promise<PaginatedResult<Order>> {
    assertStoreHttp();
    const page = await fetchAdminStoreOrders(query);
    return {
      ...page,
      items: page.items.map(normalizeOrderPayment),
    };
  },

  async getAll(query: OrderListQuery): Promise<PaginatedResult<Order>> {
    assertStoreHttp();
    const page = await fetchAdminStoreOrders(query);
    const items = await Promise.all(
      page.items.map(async (item) => {
        const detail = await fetchAdminStoreOrder(query.companyId, item.id);
        return normalizeOrderPayment(detail ?? item);
      }),
    );
    return { ...page, items };
  },

  async getById(companyId: string, id: string) {
    assertStoreHttp();
    const order = await fetchAdminStoreOrder(companyId, id);
    return order ? normalizeOrderPayment(order) : null;
  },

  async updateStatus(companyId: string, id: string, input: UpdateOrderStatusInput) {
    assertStoreHttp();
    const order = await fetchAdminStoreOrder(companyId, id);
    if (!order) throw new Error('الطلب غير موجود.');

    if (order.status === input.status) {
      return normalizeOrderPayment(order);
    }

    // خصم المخزون عند «تم الشحن» فقط — ليس عند إنشاء الطلب من المتجر
    if (input.status === STOCK_DEDUCT_STATUS && order.status !== STOCK_DEDUCT_STATUS) {
      const already = await orderAlreadyDeducted(companyId, order);
      if (already) {
        console.log('[orders] sale-deduct skipped — already deducted for', order.orderNumber);
        toast.message(`المخزون خُصم مسبقاً للطلب ${order.orderNumber}`);
      } else {
        const lines = await ensureSaleLinesVariantIds(
          companyId,
          order.orderNumber,
          buildDeductLines(order),
        );
        if (lines.length > 0) {
          const deductResult = await inventoryStockService.saleDeduct({
            companyId,
            sourceDocument: order.orderNumber,
            partnerName: order.customerNameAr,
            notes: `صرف عند شحن الطلب ${order.orderNumber}`,
            lines,
          });
          console.log('[orders] sale-deduct on status=shipped', deductResult);
          toast.message(`خصم مخزون: ${summarizeSaleLines(deductResult)}`);
        }
      }
    }

    // إرجاع المخزون تلقائي من الباك اند عند cancelled / refunded (نفس sourceDocument)
    if (RESTORE_STATUSES.includes(input.status) && !RESTORE_STATUSES.includes(order.status)) {
      console.log('[orders] sale-restore delegated to backend for', order.orderNumber, input.status);
    }

    return normalizeOrderPayment(await updateAdminStoreOrderStatus(companyId, id, input));
  },

  async updatePaymentStatus(companyId: string, id: string, input: UpdateOrderPaymentStatusInput) {
    assertStoreHttp();
    return normalizeOrderPayment(await updateAdminStoreOrderPayment(companyId, id, input));
  },

  async saveLineAllocations(companyId: string, orderId: string, input: SaveOrderLineAllocationsInput) {
    assertStoreHttp();
    const order = await fetchAdminStoreOrder(companyId, orderId);
    if (!order) throw new Error('الطلب غير موجود.');
    const line = resolveOrderLine(order, input);
    return normalizeOrderPayment(
      await saveAdminStoreLineAllocations(companyId, orderId, line.lineId!, input),
    );
  },

  /** تحديث حالة شحن البند فقط — الخصم مرتبط بحالة الطلب «تم الشحن». */
  async shipLine(companyId: string, orderId: string, input: ShipOrderLineInput) {
    assertStoreHttp();
    const order = await fetchAdminStoreOrder(companyId, orderId);
    if (!order) throw new Error('الطلب غير موجود.');
    const line = resolveOrderLine(order, input);
    if (line.shipStatus === 'shipped') {
      return normalizeOrderPayment(order);
    }

    return normalizeOrderPayment(await shipAdminStoreLine(companyId, orderId, line.lineId!, input));
  },

  async updateLineShipStatus(
    companyId: string,
    orderId: string,
    input: UpdateOrderLineShipStatusInput,
  ) {
    assertStoreHttp();
    const order = await fetchAdminStoreOrder(companyId, orderId);
    if (!order) throw new Error('الطلب غير موجود.');
    const line = resolveOrderLine(order, input);
    if (line.shipStatus === input.shipStatus) {
      return normalizeOrderPayment(order);
    }
    return normalizeOrderPayment(
      await updateAdminStoreLineShipStatus(
        companyId,
        orderId,
        line.lineId!,
        input.shipStatus,
        input.note,
      ),
    );
  },

  async addAttachment(
    companyId: string,
    orderId: string,
    input: CreateStoreOrderAttachmentInput,
  ) {
    assertStoreHttp();
    return normalizeOrderPayment(
      await addAdminStoreOrderAttachment(companyId, orderId, input),
    );
  },

  async updateAttachment(
    companyId: string,
    orderId: string,
    attachmentId: string,
    input: UpdateStoreOrderAttachmentInput,
  ) {
    assertStoreHttp();
    return normalizeOrderPayment(
      await updateAdminStoreOrderAttachment(companyId, orderId, attachmentId, input),
    );
  },

  async removeAttachment(companyId: string, orderId: string, attachmentId: string) {
    assertStoreHttp();
    return normalizeOrderPayment(
      await deleteAdminStoreOrderAttachment(companyId, orderId, attachmentId),
    );
  },

  async updateStaffNote(companyId: string, orderId: string, input: UpdateOrderStaffNoteInput) {
    assertStoreHttp();
    return normalizeOrderPayment(
      await updateAdminStoreOrderStaffNote(companyId, orderId, input),
    );
  },
};
