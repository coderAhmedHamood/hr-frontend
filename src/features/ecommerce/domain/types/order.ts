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
  productId: string;
  productNameAr: string;
  quantity: number;
  unitPrice: Money;
  allocations: OrderLineAllocation[];
  shipStatus: OrderLineShipStatus;
  imageUrl?: string | null;
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
  paymentMethod?: 'cash_on_delivery' | 'card';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  /** Transfer / card receipt image URL when the customer attached proof. */
  paymentProofUrl?: string | null;
  subtotalAmount?: Money;
  shippingFeeAmount?: Money;
  source?: 'seed' | 'storefront';
};

export type OrderFulfilmentFilter = 'fulfilled' | 'partial' | 'unfulfilled';

export type OrderListQuery = {
  companyId: string;
  search?: string;
  status?: OrderStatus;
  customerId?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'cash_on_delivery' | 'card';
  fulfilment?: OrderFulfilmentFilter;
  source?: 'seed' | 'storefront';
  city?: string;
  page?: number;
  limit?: number;
};

export type UpdateOrderStatusInput = {
  status: OrderStatus;
};

export type UpdateOrderPaymentStatusInput = {
  paymentStatus: NonNullable<Order['paymentStatus']>;
};

export type SaveOrderLineAllocationsInput = {
  productId: string;
  allocations: Array<{
    warehouseId: string;
    locationId: string;
    quantity: number;
  }>;
};

export type ShipOrderLineInput = {
  productId: string;
};
