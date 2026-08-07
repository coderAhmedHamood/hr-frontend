import type { Money, TenantScoped } from '@/features/ecommerce/domain/types/common';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export type OrderLineShipStatus = 'unassigned' | 'assigned' | 'partial' | 'shipped';

/** Quantity reserved/taken from a specific stock location for one order line. */
export type OrderLineAllocation = {
  id: string;
  warehouseId: string;
  locationId: string;
  quantity: number;
};

export type OrderLineItem = {
  /** Backend store_order_lines.id — required for allocation/ship APIs. */
  lineId?: string;
  productId: string;
  variantId?: string | null;
  productNameAr: string;
  quantity: number;
  unitPrice: Money;
  allocations: OrderLineAllocation[];
  shipStatus: OrderLineShipStatus;
  imageUrl?: string | null;
};

/** One status transition from `GET /store-admin/orders/:id` → `statusHistory`. */
export type OrderStatusHistoryEntry = {
  id?: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  /** Staff user UUID; null when changed from storefront / customer. */
  changedBy: string | null;
  note: string | null;
  createdAt: string;
};

export type Order = TenantScoped & {
  id: string;
  orderNumber: string;
  customerId: string;
  customerNameAr: string;
  city?: string;
  region?: string;
  status: OrderStatus;
  items: OrderLineItem[];
  totalAmount: Money;
  createdAt: string;
  updatedAt: string;
  /** Present for storefront checkouts synced into the admin dashboard. */
  phone?: string;
  shippingStreet?: string;
  shippingDistrict?: string;
  shippingNotes?: string;
  /** Free-text note from the customer at place-order (`customerNote`). */
  customerNote?: string | null;
  paymentMethod?: 'cash_on_delivery' | 'card';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  /**
   * Transfer / card receipt image URLs (one or more).
   * Prefer this over the legacy single `paymentProofUrl`.
   */
  paymentProofUrls?: string[];
  /** @deprecated Use `paymentProofUrls` — kept for older seeds/API payloads. */
  paymentProofUrl?: string | null;
  subtotalAmount?: Money;
  shippingFeeAmount?: Money;
  source?: 'seed' | 'storefront';
  /** Chronological status changes — present on full order detail only. */
  statusHistory?: OrderStatusHistoryEntry[];
};

export type OrderFulfilmentFilter = 'fulfilled' | 'partial' | 'unfulfilled';

export type OrderListQuery = {
  companyId: string;
  search?: string;
  status?: OrderStatus;
  customerId?: string;
  /** Filter by registered contacts partner (`store_orders.partner_id`). */
  partnerId?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'cash_on_delivery' | 'card';
  fulfilment?: OrderFulfilmentFilter;
  source?: 'seed' | 'storefront';
  city?: string;
  /** Inclusive YYYY-MM-DD on `createdAt` (local calendar day of the ISO timestamp). */
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type UpdateOrderStatusInput = {
  status: OrderStatus;
  note?: string | null;
};

export type UpdateOrderPaymentStatusInput = {
  paymentStatus: NonNullable<Order['paymentStatus']>;
  paymentProofUrl?: string | null;
};

export type SaveOrderLineAllocationsInput = {
  productId: string;
  /** Prefer when known — avoids ambiguous productId matches. */
  lineId?: string;
  allocations: Array<{
    warehouseId: string;
    locationId: string;
    quantity: number;
  }>;
};

export type ShipOrderLineInput = {
  productId: string;
  lineId?: string;
  /** Optional staff note — recorded in statusHistory. */
  note?: string | null;
  /** When provided, used for stock issue (avoids stale order refetch). */
  allocations?: Array<{
    warehouseId: string;
    locationId: string;
    quantity: number;
  }>;
};

export type UpdateOrderLineShipStatusInput = {
  productId: string;
  lineId?: string;
  shipStatus: OrderLineShipStatus;
  /** Optional staff note — recorded in statusHistory. */
  note?: string | null;
};
