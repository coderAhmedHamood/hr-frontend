import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';

type NotificationLinkInput = {
  actionUrl?: string | null;
  sourceKind?: string | null;
  sourceTable?: string | null;
  sourceId?: string | null;
};

const ORDER_SOURCE_KINDS = new Set([
  'store_order_placed',
  'store_order_confirmed',
  'store_order_processing',
  'store_order_shipped',
  'store_order_delivered',
  'store_order_cancelled',
  'store_order_refunded',
  'store_payment_updated',
]);

/** Prefer backend actionUrl; then sourceTable + sourceId; then sourceKind fallback. */
export function resolveStoreNotificationLink(input: NotificationLinkInput): string | null {
  if (input.actionUrl?.trim()) return input.actionUrl;

  if (input.sourceTable === 'store_orders' && input.sourceId) {
    return `${ecommerceAdminRoutes.orders}?order=${encodeURIComponent(input.sourceId)}`;
  }

  if (input.sourceTable === 'store_contact_messages') {
    if (input.sourceId) {
      return `${ecommerceAdminRoutes.contactMessages}?highlight=${encodeURIComponent(input.sourceId)}`;
    }
    return ecommerceAdminRoutes.contactMessages;
  }

  if (input.sourceKind && ORDER_SOURCE_KINDS.has(input.sourceKind) && input.sourceId) {
    return `${ecommerceAdminRoutes.orders}?order=${encodeURIComponent(input.sourceId)}`;
  }

  if (input.sourceKind === 'store_contact_message_received') {
    return ecommerceAdminRoutes.contactMessages;
  }

  return null;
}
