import { create } from 'zustand';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';
import {
  markUserInboxCategoryAllRead,
  notificationsApi,
  type InboxItemResponseDto,
} from '@/features/hr/notifications/lib/api/notifications';
import { ApiError } from '@/features/hr/lib/api/client';

export interface InventoryNotificationRecord {
  id: string;
  notificationId: string;
  titleAr: string;
  bodyAr?: string;
  category: string;
  severity: string;
  actionUrl?: string | null;
  actionLabelAr?: string | null;
  sourceKind?: string | null;
  sourceTable?: string | null;
  sourceId?: string | null;
  state: string;
  isRead: boolean;
  companyNameAr?: string;
  recipientUserId: string;
  triggeredByNameAr?: string | null;
  createdAt: string;
  readAt: string | null;
}

function mapApi(row: InboxItemResponseDto, userId: string): InventoryNotificationRecord {
  return {
    id: row.recipientId,
    notificationId: row.notificationId,
    titleAr: row.titleAr,
    bodyAr: row.bodyAr ?? undefined,
    category: row.category,
    severity: row.severity,
    actionUrl: row.actionUrl,
    actionLabelAr: row.actionLabelAr,
    sourceKind: row.sourceKind,
    sourceTable: row.sourceTable,
    sourceId: row.sourceId,
    state: row.state,
    isRead: row.isRead,
    companyNameAr: row.companyNameAr,
    recipientUserId: row.userId ?? userId,
    triggeredByNameAr: row.triggeredByNameAr,
    createdAt: row.createdAt,
    readAt: row.readAt,
  };
}

interface InventoryNotificationsState {
  items: InventoryNotificationRecord[];
  isLoading: boolean;
  error: { message: string; status: number } | null;
  unreadTotal: number;
  fetch: (userId: string) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllReadForUser: (userId: string) => Promise<void>;
}

export const useInventoryNotificationsStore = create<InventoryNotificationsState>()((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  unreadTotal: 0,

  fetch: async (userId) => {
    const companyId = getInventoryCompanyId();
    set({ isLoading: true, error: null });
    try {
      const [result, unreadRes] = await Promise.all([
        notificationsApi.userInbox(userId, {
          companyId,
          category: 'inventory',
          limit: 20,
        }),
        notificationsApi.userUnreadCount(userId, companyId),
      ]);
      set({
        items: result.items.map((row) => mapApi(row, userId)),
        unreadTotal: unreadRes.byCategory?.inventory ?? 0,
        isLoading: false,
      });
    } catch (e) {
      set({
        error: {
          message: (e as Error).message,
          status: e instanceof ApiError ? e.status : 0,
        },
        isLoading: false,
      });
    }
  },

  markRead: async (id) => {
    const item = get().items.find((x) => x.id === id);
    if (!item || item.readAt) return;
    try {
      const updated = await notificationsApi.userMarkRead(item.recipientUserId, id);
      set((s) => ({
        items: s.items.map((x) =>
          x.id === id
            ? { ...x, readAt: updated.readAt, isRead: updated.isRead, state: updated.state }
            : x,
        ),
        unreadTotal: Math.max(0, s.unreadTotal - 1),
      }));
    } catch {
      set((s) => ({
        items: s.items.map((x) =>
          x.id === id
            ? { ...x, readAt: x.readAt ?? new Date().toISOString(), isRead: true, state: 'read' }
            : x,
        ),
        unreadTotal: Math.max(0, s.unreadTotal - 1),
      }));
    }
  },

  markAllReadForUser: async (userId) => {
    const companyId = getInventoryCompanyId();
    try {
      await markUserInboxCategoryAllRead(userId, 'inventory', companyId);
      const now = new Date().toISOString();
      set((s) => ({
        items: s.items.map((x) =>
          x.recipientUserId === userId && !x.readAt
            ? { ...x, readAt: now, isRead: true, state: 'read' }
            : x,
        ),
        unreadTotal: 0,
      }));
    } catch {
      // keep local state unchanged on API failure
    }
  },
}));

export function selectInventoryInbox(items: InventoryNotificationRecord[], userId: string) {
  return items
    .filter((x) => x.recipientUserId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function countUnreadInventoryInbox(items: InventoryNotificationRecord[], userId: string) {
  return selectInventoryInbox(items, userId).filter((x) => !x.readAt).length;
}
