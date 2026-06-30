import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { notificationsApi, type InboxItemResponseDto } from './api/notifications';
import { ApiError } from '@/features/hr/lib/api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HRNotificationRecord {
  id: string;
  titleAr: string;
  bodyAr?: string;
  recipientEmployeeId: string;
  createdAt: string;
  readAt: string | null;
  /** إخفاء من القائمة المنبثقة ومن صندوق المستخدم — السجل يبقى للمسؤول */
  dismissedAt: string | null;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapApi(r: InboxItemResponseDto): HRNotificationRecord {
  return {
    id: r.recipientId, // use recipientId as the local ID for mutations
    titleAr: r.titleAr,
    bodyAr: r.bodyAr ?? undefined,
    recipientEmployeeId: r.employeeId,
    createdAt: r.createdAt,
    readAt: r.readAt,
    dismissedAt: r.dismissedAt,
  };
}

// ─── State interface ──────────────────────────────────────────────────────────

interface NotificationsState {
  items: HRNotificationRecord[];
  isLoading: boolean;
  error: { message: string; status: number } | null;
  unreadTotal: number;
  fetch: (employeeId: string) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markUnread: (id: string) => Promise<void>;
  markAllReadForRecipient: (employeeId: string) => Promise<void>;
  dismissFromInbox: (id: string) => Promise<void>;
  dismissAllVisibleForRecipient: (employeeId: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useHRNotificationsStore = create<NotificationsState>()((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  unreadTotal: 0,

  fetch: async (employeeId) => {
    const companyId = getDefaultCompanyId() ?? undefined;
    set({ isLoading: true, error: null });
    try {
      const [result, unreadRes] = await Promise.all([
        notificationsApi.inbox(employeeId, {
          companyId,
          includeDismissed: true,
          limit: 200,
        }),
        notificationsApi.unreadCount(employeeId, companyId),
      ]);
      set({
        items: result.items.map(mapApi),
        unreadTotal: unreadRes.unread,
        isLoading: false,
      });
    } catch (e) {
      set({ error: { message: (e as Error).message, status: e instanceof ApiError ? e.status : 0 }, isLoading: false });
    }
  },

  markRead: async (id) => {
    const item = get().items.find(x => x.id === id);
    if (!item) return;
    try {
      const updated = await notificationsApi.markRead(item.recipientEmployeeId, id);
      set(s => ({
        items: s.items.map(x => x.id === id ? { ...x, readAt: updated.readAt } : x),
        unreadTotal: Math.max(0, s.unreadTotal - (item.readAt ? 0 : 1)),
      }));
    } catch {
      // optimistic fallback — update locally so UI stays responsive
      set(s => ({
        items: s.items.map(x => x.id === id ? { ...x, readAt: x.readAt ?? new Date().toISOString() } : x),
      }));
    }
  },

  markUnread: async (id) => {
    const item = get().items.find(x => x.id === id);
    if (!item) return;
    try {
      await notificationsApi.markUnread(item.recipientEmployeeId, id);
      set(s => ({
        items: s.items.map(x => x.id === id ? { ...x, readAt: null } : x),
      }));
    } catch {
      set(s => ({
        items: s.items.map(x => x.id === id ? { ...x, readAt: null } : x),
      }));
    }
  },

  markAllReadForRecipient: async (employeeId) => {
    const companyId = getDefaultCompanyId() ?? undefined;
    try {
      await notificationsApi.markAllRead(employeeId, companyId);
      const now = new Date().toISOString();
      set(s => ({
        items: s.items.map(x =>
          x.recipientEmployeeId === employeeId && !x.dismissedAt && !x.readAt
            ? { ...x, readAt: now }
            : x,
        ),
        unreadTotal: 0,
      }));
    } catch {
      // noop — do not mutate local state if the API call failed
    }
  },

  dismissFromInbox: async (id) => {
    const item = get().items.find(x => x.id === id);
    if (!item) return;
    try {
      const updated = await notificationsApi.dismiss(item.recipientEmployeeId, id);
      set(s => ({
        items: s.items.map(x => x.id === id ? { ...x, dismissedAt: updated.dismissedAt } : x),
      }));
    } catch {
      set(s => ({
        items: s.items.map(x =>
          x.id === id ? { ...x, dismissedAt: x.dismissedAt ?? new Date().toISOString() } : x,
        ),
      }));
    }
  },

  dismissAllVisibleForRecipient: async (employeeId) => {
    const undismissed = get().items.filter(
      x => x.recipientEmployeeId === employeeId && !x.dismissedAt,
    );
    await Promise.allSettled(
      undismissed.map(x => notificationsApi.dismiss(employeeId, x.id)),
    );
    const now = new Date().toISOString();
    set(s => ({
      items: s.items.map(x =>
        x.recipientEmployeeId === employeeId && !x.dismissedAt
          ? { ...x, dismissedAt: now }
          : x,
      ),
    }));
  },
}));

// ─── Selectors ────────────────────────────────────────────────────────────────

export function selectInboxForRecipient(items: HRNotificationRecord[], employeeId: string) {
  return items
    .filter(x => x.recipientEmployeeId === employeeId && !x.dismissedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function countUnreadInbox(items: HRNotificationRecord[], employeeId: string) {
  return selectInboxForRecipient(items, employeeId).filter(x => !x.readAt).length;
}
