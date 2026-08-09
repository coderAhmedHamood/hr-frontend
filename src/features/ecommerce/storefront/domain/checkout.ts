import type { Money } from '@/features/ecommerce/domain/types/common';
import type {
  CreateStoreOrderAttachmentInput,
  StoreOrderAttachment,
} from '@/features/ecommerce/domain/types/order';

export type CheckoutPaymentMethod =
  | 'cash_on_delivery'
  | 'cash'
  | 'bank'
  | 'network'
  | 'wallet'
  | 'card'
  | 'other';

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

/** Snapshot saved on the order when a company payment account is linked. */
export type PaymentAccountSnapshot = {
  id: string;
  type: string;
  nameAr: string;
  nameEn?: string | null;
  providerName?: string | null;
  accountHolderName?: string | null;
  mobile?: string | null;
  accountNumber?: string | null;
  iban?: string | null;
  currencyCode?: string | null;
};

/** Methods that require selecting a matching payment account at checkout. */
export const PAYMENT_METHODS_REQUIRING_ACCOUNT: CheckoutPaymentMethod[] = [
  'bank',
  'network',
  'wallet',
];

export function paymentMethodRequiresAccount(method: CheckoutPaymentMethod): boolean {
  return PAYMENT_METHODS_REQUIRING_ACCOUNT.includes(method);
}

export type PlaceOrderInput = {
  companyId: string;
  locale: string;
  address: CheckoutAddressInput;
  paymentMethod: CheckoutPaymentMethod;
  /** Required for bank / network / wallet — must match account type. */
  paymentAccountId?: string | null;
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
  paymentAccountId?: string | null;
  paymentAccountSnapshot?: PaymentAccountSnapshot | null;
  paymentProofUrls?: string[];
  /** @deprecated Prefer `paymentProofUrls`. */
  paymentProofUrl?: string | null;
  /** Customer note at place-order. */
  customerNote?: string | null;
  /** Store note — present only when staff made it visible to the customer. */
  staffNote?: string | null;
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

/** Shipping fee stub — fee rules removed; always free until reworked. */
export function calculateShippingFee(_subtotalAmount: number, currency = 'YER'): Money {
  return { amount: 0, currency };
}
