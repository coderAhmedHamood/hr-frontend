import { apiRequest, ensurePaginatedResult, type PaginatedResult } from '@/features/hr/lib/api/client';
import type {
  Order,
  OrderListQuery,
  OrderLineItem,
  SaveOrderLineAllocationsInput,
  ShipOrderLineInput,
  UpdateOrderPaymentStatusInput,
  UpdateOrderStatusInput,
} from '@/features/ecommerce/domain/types/order';
import type {
  PlaceOrderInput,
  StorefrontCustomerOrder,
} from '@/features/ecommerce/storefront/domain/checkout';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import {
  fromDecimalString,
  isStoreHttpEnabled,
  publicStoreRequest,
  toDecimalString,
} from '@/features/ecommerce/storefront/lib/api/store-http';
import { resolvePaymentProofUrls } from '@/features/ecommerce/domain/lib/payment-proofs';

type StorePaginatedMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type StoreOrderLineDto = {
  id: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  productSlug: string;
  imageUrl?: string | null;
  quantity: number;
  unitPriceAmount: string;
  unitPriceCurrency: string;
  lineTotalAmount: string;
  shipStatus: OrderLineItem['shipStatus'];
  sortOrder: number;
  allocations: Array<{
    id: string;
    warehouseId: string;
    locationId: string;
    quantity: string;
  }>;
};

type StoreOrderDto = {
  id: string;
  companyId: string;
  orderNumber: string;
  partnerId?: string | null;
  customerNameAr: string;
  phone?: string | null;
  status: Order['status'];
  paymentMethod: NonNullable<Order['paymentMethod']>;
  paymentStatus: NonNullable<Order['paymentStatus']>;
  paymentProofUrl?: string | null;
  paymentProofUrls?: string[] | null;
  source?: Order['source'];
  locale?: string;
  shipFullName: string;
  shipPhone: string;
  shipCity: string;
  shipDistrict: string;
  shipStreet: string;
  shipNotes?: string | null;
  customerNote?: string | null;
  shipLat?: number | null;
  shipLng?: number | null;
  shipMapAddress?: string | null;
  currencyCode: string;
  subtotalAmount: string;
  shippingFeeAmount: string;
  totalAmount: string;
  estimatedDeliveryAt?: string | null;
  lines: StoreOrderLineDto[];
  statusHistory?: Array<{
    id?: string;
    fromStatus?: Order['status'] | null;
    toStatus: Order['status'];
    changedBy?: string | null;
    note?: string | null;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

type StoreOrderListItemDto = {
  id: string;
  orderNumber: string;
  customerNameAr: string;
  phone?: string | null;
  status: Order['status'];
  paymentMethod: NonNullable<Order['paymentMethod']>;
  paymentStatus: NonNullable<Order['paymentStatus']>;
  shipCity: string;
  currencyCode: string;
  totalAmount: string;
  lineCount: number;
  createdAt: string;
};

function mapLine(dto: StoreOrderLineDto): OrderLineItem {
  return {
    lineId: dto.id,
    productId: dto.productId,
    variantId: dto.variantId ?? null,
    productNameAr: dto.productName,
    quantity: dto.quantity,
    unitPrice: {
      amount: fromDecimalString(dto.unitPriceAmount),
      currency: dto.unitPriceCurrency,
    },
    allocations: (dto.allocations ?? []).map((row) => ({
      id: row.id,
      warehouseId: row.warehouseId,
      locationId: row.locationId,
      quantity: fromDecimalString(row.quantity),
    })),
    shipStatus: dto.shipStatus ?? 'unassigned',
    imageUrl: dto.imageUrl ?? null,
  };
}

function mapStatusHistory(
  rows: StoreOrderDto['statusHistory'],
): NonNullable<Order['statusHistory']> {
  if (!rows?.length) return [];
  return [...rows]
    .map((row) => ({
      id: row.id,
      fromStatus: row.fromStatus ?? null,
      toStatus: row.toStatus,
      changedBy: row.changedBy ?? null,
      note: row.note ?? null,
      createdAt: row.createdAt,
    }))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function mapAdminOrder(dto: StoreOrderDto): Order {
  const proofUrls = resolvePaymentProofUrls({
    paymentProofUrls: dto.paymentProofUrls,
    paymentProofUrl: dto.paymentProofUrl,
  });
  const currency = dto.currencyCode || 'YER';
  return {
    id: dto.id,
    companyId: dto.companyId,
    orderNumber: dto.orderNumber,
    customerId: dto.partnerId ?? `guest:${dto.shipPhone}`,
    customerNameAr: dto.customerNameAr,
    city: dto.shipCity,
    region: dto.shipDistrict,
    status: dto.status,
    items: (dto.lines ?? []).map(mapLine),
    totalAmount: { amount: fromDecimalString(dto.totalAmount), currency },
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    phone: dto.phone ?? dto.shipPhone,
    shippingStreet: dto.shipStreet,
    shippingDistrict: dto.shipDistrict,
    shippingNotes: dto.shipNotes ?? undefined,
    customerNote: dto.customerNote ?? null,
    paymentMethod: dto.paymentMethod,
    paymentStatus: dto.paymentStatus,
    paymentProofUrls: proofUrls,
    paymentProofUrl: proofUrls[0] ?? null,
    subtotalAmount: { amount: fromDecimalString(dto.subtotalAmount), currency },
    shippingFeeAmount: { amount: fromDecimalString(dto.shippingFeeAmount), currency },
    source: dto.source ?? 'storefront',
    statusHistory: mapStatusHistory(dto.statusHistory),
  };
}

function mapListItem(dto: StoreOrderListItemDto, companyId: string): Order {
  const currency = dto.currencyCode || 'YER';
  return {
    id: dto.id,
    companyId,
    orderNumber: dto.orderNumber,
    customerId: `guest:${dto.phone ?? dto.orderNumber}`,
    customerNameAr: dto.customerNameAr,
    city: dto.shipCity,
    status: dto.status,
    items: [],
    totalAmount: { amount: fromDecimalString(dto.totalAmount), currency },
    createdAt: dto.createdAt,
    updatedAt: dto.createdAt,
    phone: dto.phone ?? undefined,
    paymentMethod: dto.paymentMethod,
    paymentStatus: dto.paymentStatus,
    source: 'storefront',
  };
}

function mapStorefrontOrder(dto: StoreOrderDto): StorefrontCustomerOrder {
  const proofUrls = resolvePaymentProofUrls({
    paymentProofUrls: dto.paymentProofUrls,
    paymentProofUrl: dto.paymentProofUrl,
  });
  const currency = dto.currencyCode || 'YER';
  return {
    id: dto.id,
    companyId: dto.companyId,
    orderNumber: dto.orderNumber,
    status: dto.status === 'refunded' ? 'cancelled' : dto.status,
    paymentMethod: dto.paymentMethod,
    paymentStatus: dto.paymentStatus,
    paymentProofUrls: proofUrls,
    paymentProofUrl: proofUrls[0] ?? null,
    customerNote: dto.customerNote ?? null,
    address: {
      fullName: dto.shipFullName,
      phone: dto.shipPhone,
      city: dto.shipCity,
      district: dto.shipDistrict,
      street: dto.shipStreet,
      notes: dto.shipNotes ?? undefined,
      lat: dto.shipLat ?? undefined,
      lng: dto.shipLng ?? undefined,
      mapAddress: dto.shipMapAddress ?? undefined,
    },
    lines: (dto.lines ?? []).map((line) => ({
      productId: line.productId,
      variantId: line.variantId ?? undefined,
      productName: line.productName,
      productSlug: line.productSlug,
      quantity: line.quantity,
      unitPrice: {
        amount: fromDecimalString(line.unitPriceAmount),
        currency: line.unitPriceCurrency || currency,
      },
      imageUrl: line.imageUrl ?? null,
      lineTotal: {
        amount: fromDecimalString(line.lineTotalAmount),
        currency: line.unitPriceCurrency || currency,
      },
    })),
    subtotal: { amount: fromDecimalString(dto.subtotalAmount), currency },
    shippingFee: { amount: fromDecimalString(dto.shippingFeeAmount), currency },
    total: { amount: fromDecimalString(dto.totalAmount), currency },
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    estimatedDeliveryAt: dto.estimatedDeliveryAt ?? dto.createdAt,
  };
}

export async function placePublicStoreOrder(
  input: PlaceOrderInput,
  partnerToken?: string | null,
): Promise<StorefrontCustomerOrder> {
  const proofUrls = resolvePaymentProofUrls({
    paymentProofUrls: input.paymentProofUrls,
    paymentProofUrl: input.paymentProofUrl,
  });
  const idempotencyKey =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `order-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const dto = await publicStoreRequest<StoreOrderDto>('/public/store/orders', {
    method: 'POST',
    token: partnerToken,
    headers: { 'Idempotency-Key': idempotencyKey },
    body: {
      companyId: resolveStorefrontCompanyId(input.companyId),
      paymentMethod: input.paymentMethod,
      paymentProofUrl: proofUrls[0] ?? null,
      locale: input.locale || 'ar',
      ...(input.customerNote?.trim()
        ? { customerNote: input.customerNote.trim() }
        : {}),
      address: {
        fullName: input.address.fullName,
        phone: input.address.phone,
        city: input.address.city,
        district: input.address.district,
        street: input.address.street,
        notes: input.address.notes ?? null,
        lat: input.address.lat ?? null,
        lng: input.address.lng ?? null,
        mapAddress: input.address.mapAddress ?? null,
      },
      items: input.lines.map((line) => ({
        productId: line.productId,
        variantId: line.variantId ?? null,
        quantity: line.quantity,
      })),
    },
  });
  if (!dto) throw new Error('ORDER_CREATE_FAILED');
  // Stock is deducted by admin when order status → shipped (not at place-order).
  console.log('[orders] place-order created (no frontend stock deduct)', {
    orderNumber: dto.orderNumber,
    id: dto.id,
    status: dto.status,
  });
  return mapStorefrontOrder(dto);
}

export async function fetchPublicStoreOrder(input: {
  companyId: string;
  orderNumber: string;
  phone?: string | null;
  partnerToken?: string | null;
}): Promise<StorefrontCustomerOrder | null> {
  return publicStoreRequest<StoreOrderDto>(
    `/public/store/orders/${encodeURIComponent(input.orderNumber)}`,
    {
      query: {
        companyId: resolveStorefrontCompanyId(input.companyId),
        phone: input.phone?.trim() || undefined,
      },
      token: input.partnerToken,
      nullOn404: true,
    },
  ).then((dto) => (dto ? mapStorefrontOrder(dto) : null));
}

/** GET /public/store/orders — partner Bearer required (typ=partner). */
export async function fetchPartnerStoreOrders(input: {
  accessToken: string;
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{ items: StorefrontCustomerOrder[]; pagination: StorePaginatedMeta }> {
  const page = await publicStoreRequest<{
    items: StoreOrderDto[];
    pagination: StorePaginatedMeta;
  }>('/public/store/orders', {
    token: input.accessToken,
    query: {
      page: input.page ?? 1,
      limit: input.limit ?? 50,
      status: input.status,
    },
  });
  const items = page?.items ?? [];
  const pagination = page?.pagination ?? {
    page: 1,
    limit: input.limit ?? 50,
    total: items.length,
    totalPages: 1,
  };
  return {
    items: items.map(mapStorefrontOrder),
    pagination,
  };
}

export async function fetchAdminStoreOrders(
  query: OrderListQuery,
): Promise<PaginatedResult<Order>> {
  const companyId = resolveStorefrontCompanyId(query.companyId);
  const page = await apiRequest<PaginatedResult<StoreOrderListItemDto>>('/store-admin/orders', {
    throwOnError: true,
    query: {
      companyId,
      page: query.page ?? 1,
      limit: query.limit ?? 50,
      status: query.status,
      paymentStatus: query.paymentStatus,
      paymentMethod: query.paymentMethod,
      city: query.city,
      search: query.search,
      partnerId: query.partnerId,
    },
  });
  const safe = ensurePaginatedResult(page);
  return {
    items: safe.items.map((item) => mapListItem(item, companyId)),
    pagination: safe.pagination,
  };
}

export async function fetchAdminStoreOrder(companyId: string, id: string): Promise<Order | null> {
  try {
    const dto = await apiRequest<StoreOrderDto>(`/store-admin/orders/${id}`, {
      throwOnError: true,
      query: { companyId: resolveStorefrontCompanyId(companyId) },
    });
    return mapAdminOrder(dto);
  } catch {
    return null;
  }
}

export async function updateAdminStoreOrderStatus(
  companyId: string,
  id: string,
  input: UpdateOrderStatusInput,
): Promise<Order> {
  const dto = await apiRequest<StoreOrderDto>(`/store-admin/orders/${id}/status`, {
    method: 'PATCH',
    throwOnError: true,
    query: { companyId: resolveStorefrontCompanyId(companyId) },
    body: {
      status: input.status,
      ...(input.note !== undefined ? { note: input.note } : {}),
    },
  });
  return mapAdminOrder(dto);
}

export async function updateAdminStoreOrderPayment(
  companyId: string,
  id: string,
  input: UpdateOrderPaymentStatusInput,
): Promise<Order> {
  const dto = await apiRequest<StoreOrderDto>(`/store-admin/orders/${id}/payment`, {
    method: 'PATCH',
    throwOnError: true,
    query: { companyId: resolveStorefrontCompanyId(companyId) },
    body: {
      paymentStatus: input.paymentStatus,
      ...(input.paymentProofUrl !== undefined
        ? { paymentProofUrl: input.paymentProofUrl }
        : {}),
    },
  });
  return mapAdminOrder(dto);
}

export async function saveAdminStoreLineAllocations(
  companyId: string,
  orderId: string,
  lineId: string,
  input: SaveOrderLineAllocationsInput,
): Promise<Order> {
  const company = resolveStorefrontCompanyId(companyId);
  const current = await fetchAdminStoreOrder(companyId, orderId);
  const existing =
    current?.items.find((item) => item.lineId === lineId)?.allocations ?? [];

  // Replace strategy: DELETE existing allocations then POST the new set.
  for (const allocation of existing) {
    if (!allocation.id) continue;
    await apiRequest(
      `/store-admin/orders/${orderId}/lines/${lineId}/allocations/${allocation.id}`,
      {
        method: 'DELETE',
        throwOnError: true,
        query: { companyId: company },
      },
    );
  }

  for (const row of input.allocations) {
    if (!row.warehouseId || !row.locationId || !(row.quantity > 0)) {
      throw new Error('توزيع غير صالح: يلزم مستودع وموقع وكمية أكبر من صفر.');
    }
    await apiRequest(`/store-admin/orders/${orderId}/lines/${lineId}/allocations`, {
      method: 'POST',
      throwOnError: true,
      query: { companyId: company },
      body: {
        warehouseId: row.warehouseId,
        locationId: row.locationId,
        // Backend validates: "quantity must be a number string" (e.g. "1" / "1.0000").
        quantity: toDecimalString(row.quantity),
      },
    });
  }

  // Always re-fetch full order — allocation POST/DELETE payloads are not reliable order DTOs.
  const order = await fetchAdminStoreOrder(companyId, orderId);
  if (!order) throw new Error('الطلب غير موجود.');
  return order;
}

export async function deleteAdminStoreLineAllocation(
  companyId: string,
  orderId: string,
  lineId: string,
  allocationId: string,
): Promise<Order> {
  const dto = await apiRequest<StoreOrderDto>(
    `/store-admin/orders/${orderId}/lines/${lineId}/allocations/${allocationId}`,
    {
      method: 'DELETE',
      throwOnError: true,
      query: { companyId: resolveStorefrontCompanyId(companyId) },
    },
  );
  return mapAdminOrder(dto);
}

export async function updateAdminStoreLineShipStatus(
  companyId: string,
  orderId: string,
  lineId: string,
  shipStatus: OrderLineItem['shipStatus'],
  note?: string | null,
): Promise<Order> {
  const trimmed = note?.trim();
  await apiRequest(`/store-admin/orders/${orderId}/lines/${lineId}/ship-status`, {
    method: 'PATCH',
    throwOnError: true,
    query: { companyId: resolveStorefrontCompanyId(companyId) },
    body: {
      shipStatus,
      ...(trimmed ? { note: trimmed } : {}),
    },
  });
  const order = await fetchAdminStoreOrder(companyId, orderId);
  if (!order) throw new Error('الطلب غير موجود.');
  return order;
}

/** @deprecated Prefer updateAdminStoreLineShipStatus — kept for callers that only mark shipped. */
export async function shipAdminStoreLine(
  companyId: string,
  orderId: string,
  lineId: string,
  input: ShipOrderLineInput,
): Promise<Order> {
  return updateAdminStoreLineShipStatus(
    companyId,
    orderId,
    lineId,
    'shipped',
    input.note,
  );
}

export function storeOrdersHttpEnabled(): boolean {
  return isStoreHttpEnabled();
}
