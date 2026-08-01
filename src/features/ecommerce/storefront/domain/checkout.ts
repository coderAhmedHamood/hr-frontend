import type { Money } from '@/features/ecommerce/domain/types/common';

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
  city: string;
  district: string;
  street: string;
  notes?: string;
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
  /** Optional payment receipt / transfer screenshot for card / network payments. */
  paymentProofUrl?: string | null;
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
  paymentProofUrl?: string | null;
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
