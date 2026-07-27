import type {
  PlaceOrderInput,
  StorefrontCustomerOrder,
  StorefrontOrderLine,
} from '@/features/ecommerce/storefront/domain/checkout';
import { calculateShippingFee } from '@/features/ecommerce/storefront/domain/checkout';
import { mockRepositoryDelay } from '@/features/ecommerce/storefront/lib/repositories/mock-delay';

const globalForOrders = globalThis as typeof globalThis & {
  __ecommerceStorefrontOrders?: StorefrontCustomerOrder[];
};

const ORDERS: StorefrontCustomerOrder[] =
  globalForOrders.__ecommerceStorefrontOrders ??
  (globalForOrders.__ecommerceStorefrontOrders = []);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nextOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 900 + 100).toString();
  return `ND-${stamp}${rand}`;
}

function addDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/** Customer-facing storefront orders — mock in-memory store shared via globalThis. */
export const storefrontOrdersRepository = {
  async placeOrder(input: PlaceOrderInput): Promise<StorefrontCustomerOrder> {
    if (input.lines.length === 0) {
      throw new Error('EMPTY_CART');
    }

    const currency = input.lines[0]?.unitPrice.currency ?? 'YER';
    const lines: StorefrontOrderLine[] = input.lines.map((line) => ({
      ...clone(line),
      lineTotal: {
        amount: line.unitPrice.amount * line.quantity,
        currency: line.unitPrice.currency,
      },
    }));

    const subtotalAmount = lines.reduce((sum, line) => sum + line.lineTotal.amount, 0);
    const shippingFee = calculateShippingFee(subtotalAmount, currency);
    const now = new Date().toISOString();
    const isCod = input.paymentMethod === 'cash_on_delivery';

    const order: StorefrontCustomerOrder = {
      id: crypto.randomUUID(),
      companyId: input.companyId,
      orderNumber: nextOrderNumber(),
      status: 'confirmed',
      paymentMethod: input.paymentMethod,
      paymentStatus: isCod ? 'pending' : 'paid',
      address: clone(input.address),
      lines,
      subtotal: { amount: subtotalAmount, currency },
      shippingFee,
      total: { amount: subtotalAmount + shippingFee.amount, currency },
      createdAt: now,
      updatedAt: now,
      estimatedDeliveryAt: addDaysIso(3),
    };

    ORDERS.unshift(order);
    return mockRepositoryDelay(clone(order));
  },

  async getByOrderNumber(
    companyId: string,
    orderNumber: string,
  ): Promise<StorefrontCustomerOrder | null> {
    const order =
      ORDERS.find(
        (item) => item.companyId === companyId && item.orderNumber === orderNumber,
      ) ?? null;
    return mockRepositoryDelay(order ? clone(order) : null);
  },

  async listByCompany(companyId: string): Promise<StorefrontCustomerOrder[]> {
    const items = ORDERS.filter((order) => order.companyId === companyId);
    return mockRepositoryDelay(clone(items));
  },
};
