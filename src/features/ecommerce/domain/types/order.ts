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
};

export type OrderListQuery = {
  companyId: string;
  search?: string;
  status?: OrderStatus;
  customerId?: string;
  page?: number;
  limit?: number;
};

export type UpdateOrderStatusInput = {
  status: OrderStatus;
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
