import type { Money } from '@/features/ecommerce/domain/types/common';
import type {
  CreateStoreOrderAttachmentInput,
  StoreOrderAttachment,
} from '@/features/ecommerce/domain/types/order';

export type CheckoutPaymentMethod = 'cash_on_delivery' | 'card';

export type StorefrontOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type StorefrontPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type CheckoutAddressInput = {
  fullName: string;
  phone: string;
  /** Preferred geo IDs for store orders (must be showInStore). */
  countryId?: string | null;
  cityId?: string | null;
  districtId?: string | null;
  city: string;
  district: string;
  street: string;
  notes?: string;
  /** Precise delivery point picked on the map — optional, supplements the free-text fields. */
  lat?: number;
  lng?: number;
  /** Formatted address string resolved by Google's geocoder for the picked point. */
  mapAddress?: string;
};

export type CheckoutLineInput = {
  productId: string;
  variantId?: string;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPrice: Money;
  imageUrl?: string | null;
};

export type PlaceOrderInput = {
  companyId: string;
  locale: string;
  address: CheckoutAddressInput;
  paymentMethod: CheckoutPaymentMethod;
  /** Customer-facing order note (gift wrap, timing, …) — separate from address.notes. */
  customerNote?: string | null;
  /**
   * Optional payment receipt / transfer screenshots for card / network payments.
   * One or more image data-URLs / remote URLs.
   */
  paymentProofUrls?: string[];
  /** @deprecated Prefer `paymentProofUrls`. */
  paymentProofUrl?: string | null;
  /** Optional files the customer attaches to the order (≤ 20). */
  attachments?: CreateStoreOrderAttachmentInput[];
  /** Partner Bearer when the customer is logged in. */
  accessToken?: string | null;
  lines: CheckoutLineInput[];
};

export type StorefrontOrderLine = CheckoutLineInput & {
  lineTotal: Money;
};

export type StorefrontCustomerOrder = {
  id: string;
  companyId: string;
  orderNumber: string;
  status: StorefrontOrderStatus;
  paymentMethod: CheckoutPaymentMethod;
  paymentStatus: StorefrontPaymentStatus;
  paymentProofUrls?: string[];
  /** @deprecated Prefer `paymentProofUrls`. */
  paymentProofUrl?: string | null;
  /** Customer note at place-order. */
  customerNote?: string | null;
  /** Files attached to the order (customer + staff). */
  attachments?: StoreOrderAttachment[];
  address: CheckoutAddressInput;
  lines: StorefrontOrderLine[];
  subtotal: Money;
  shippingFee: Money;
  total: Money;
  createdAt: string;
  updatedAt: string;
  /** Mock ETA for tracking UI */
  estimatedDeliveryAt: string;
};

export const STOREFRONT_ORDER_STATUS_FLOW: StorefrontOrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

export const YEMEN_CITIES = [
  'صنعاء',
  'عدن',
  'تعز',
  'الحديدة',
  'إب',
  'ذمار',
  'المكلا',
  'سيئون',
  'حجة',
  'صعدة',
  'مأرب',
  'البيضاء',
  'لحج',
  'أبين',
  'الضالع',
  'شبوة',
  'المحويت',
  'عمران',
] as const;

/** @deprecated Prefer company checkout settings from CMS. */
export const FREE_SHIPPING_THRESHOLD_YER = 200;
/** @deprecated Prefer company checkout settings from CMS. */
export const STANDARD_SHIPPING_FEE_YER = 25;

export function calculateShippingFee(
  subtotalAmount: number,
  currency = 'YER',
  options?: { freeShippingThreshold?: number; standardShippingFee?: number },
): Money {
  const freeThreshold = options?.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD_YER;
  const standardFee = options?.standardShippingFee ?? STANDARD_SHIPPING_FEE_YER;
  const amount = currency === 'YER' && subtotalAmount >= freeThreshold ? 0 : standardFee;
  return { amount, currency };
}
