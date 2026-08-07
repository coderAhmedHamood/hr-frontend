import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationCategory =
  | 'leave'
  | 'discipline'
  | 'payroll'
  | 'contract'
  | 'attendance'
  | 'advance'
  | 'announcement'
  | 'system';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export type NotificationAudienceKind =
  | 'employee'
  | 'branch'
  | 'department'
  | 'company';

export type InboxItemResponseDto = {
  recipientId: string;
  notificationId: string;
  companyId: string;
  companyNameAr: string;
  employeeId: string;
  employeeNameAr: string;
  employeeCode: string | null;
  category: NotificationCategory;
  severity: NotificationSeverity;
  audienceKind: NotificationAudienceKind;
  titleAr: string;
  bodyAr: string | null;
  titleEn: string | null;
  bodyEn: string | null;
  sourceKind: string | null;
  sourceTable: string | null;
  sourceId: string | null;
  actionUrl: string | null;
  actionLabelAr: string | null;
  requiresAcknowledgment: boolean;
  expiresAt: string | null;
  triggeredByUserId: string | null;
  triggeredByNameAr: string | null;
  createdBy: string | null;
  deliveryChannel: string;
  state: string;
  isRead: boolean;
  deliveredAt: string;
  readAt: string | null;
  dismissedAt: string | null;
  acknowledgedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationAudienceEmployeeDto = {
  employeeId: string;
  employeeCode: string;
  nameAr: string;
  nameEn: string | null;
};

export type SentNotificationResponseDto = {
  id: string;
  companyId: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  titleAr: string;
  bodyAr: string | null;
  titleEn: string | null;
  bodyEn: string | null;
  audienceKind: NotificationAudienceKind;
  audienceSnapshot: Record<string, unknown> | null;
  audienceEmployees?: NotificationAudienceEmployeeDto[];
  sourceKind: string | null;
  sourceTable: string | null;
  sourceId: string | null;
  actionUrl: string | null;
  actionLabelAr: string | null;
  requiresAcknowledgment: boolean;
  expiresAt: string | null;
  triggeredByUserId: string | null;
  triggeredByNameAr: string | null;
  recipientCount: number;
  readCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type NotificationRecipientDto = {
  recipientId: string;
  notificationId: string;
  employeeId: string;
  employeeNameAr: string;
  employeeCode: string;
  hasUser: boolean;
  userId: string | null;
  userEmail: string | null;
  userFullNameAr: string | null;
  deliveryChannel: string;
  deliveredAt: string | null;
  state: string;
  isRead: boolean;
  readAt: string | null;
  dismissedAt: string | null;
  acknowledgedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
};

export type NotificationDetailResponseDto = SentNotificationResponseDto & {
  recipients: NotificationRecipientDto[];
};

export type SendNotificationDto = {
  companyId: string;
  category: NotificationCategory;
  severity?: NotificationSeverity;
  titleAr: string;
  bodyAr?: string | null;
  titleEn?: string | null;
  bodyEn?: string | null;
  audienceKind: NotificationAudienceKind;
  employeeIds?: string[];
  branchIds?: string[];
  departmentIds?: string[];
  deliveryChannel?: 'in_app';
  sourceKind?: string;
  sourceTable?: string;
  sourceId?: string;
  actionUrl?: string;
  actionLabelAr?: string;
  requiresAcknowledgment?: boolean;
  expiresAt?: string;
  triggeredByUserId?: string;
  triggeredByNameAr?: string | null;
  audienceSnapshot?: Record<string, unknown>;
  createdBy?: string | null;
};

export type UnreadCountResponseDto = {
  employeeId: string;
  unread: number;
  byCategory: Partial<Record<NotificationCategory, number>>;
};

// ─── API ──────────────────────────────────────────────────────────────────────

export const notificationsApi = {
  /** Admin — list sent notifications */
  list: (params?: {
    page?: number;
    limit?: number;
    companyId?: string;
    category?: NotificationCategory;
    severity?: NotificationSeverity;
    sourceKind?: string;
    sourceTable?: string;
    sourceId?: string;
    from?: string;
    to?: string;
    excludeExpired?: boolean;
  }) =>
    apiRequest<PaginatedResult<SentNotificationResponseDto>>('/notifications', {
      query: params,
    }),

  getById: (id: string) =>
    apiRequest<NotificationDetailResponseDto>(`/notifications/${id}`),

  send: (body: SendNotificationDto) =>
    apiRequest<SentNotificationResponseDto>('/notifications', {
      method: 'POST',
      body,
    }),

  delete: (id: string) =>
    apiRequest<void>(`/notifications/${id}`, { method: 'DELETE' }),

  /** Employee inbox */
  inbox: (
    employeeId: string,
    params?: {
      companyId?: string;
      category?: NotificationCategory;
      unreadOnly?: boolean;
      includeDismissed?: boolean;
      includeArchived?: boolean;
      includeExpired?: boolean;
      page?: number;
      limit?: number;
    },
  ) =>
    apiRequest<PaginatedResult<InboxItemResponseDto>>(
      `/notifications/inbox/${employeeId}`,
      { query: params },
    ),

  markRead: (employeeId: string, recipientId: string) =>
    apiRequest<InboxItemResponseDto>(
      `/notifications/inbox/${employeeId}/recipients/${recipientId}/read`,
      { method: 'POST' },
    ),

  markUnread: (employeeId: string, recipientId: string) =>
    apiRequest<InboxItemResponseDto>(
      `/notifications/inbox/${employeeId}/recipients/${recipientId}/unread`,
      { method: 'POST' },
    ),

  dismiss: (employeeId: string, recipientId: string) =>
    apiRequest<InboxItemResponseDto>(
      `/notifications/inbox/${employeeId}/recipients/${recipientId}/dismiss`,
      { method: 'POST' },
    ),

  acknowledge: (employeeId: string, recipientId: string) =>
    apiRequest<InboxItemResponseDto>(
      `/notifications/inbox/${employeeId}/recipients/${recipientId}/acknowledge`,
      { method: 'POST' },
    ),

  archive: (employeeId: string, recipientId: string) =>
    apiRequest<InboxItemResponseDto>(
      `/notifications/inbox/${employeeId}/recipients/${recipientId}/archive`,
      { method: 'POST' },
    ),

  unarchive: (employeeId: string, recipientId: string) =>
    apiRequest<InboxItemResponseDto>(
      `/notifications/inbox/${employeeId}/recipients/${recipientId}/unarchive`,
      { method: 'POST' },
    ),

  markAllRead: (employeeId: string, companyId?: string) =>
    apiRequest<{ updated: number }>(
      `/notifications/inbox/${employeeId}/mark-all-read`,
      { method: 'POST', query: companyId ? { companyId } : undefined },
    ),

  unreadCount: (employeeId: string, companyId?: string) =>
    apiRequest<UnreadCountResponseDto>(
      `/notifications/inbox/${employeeId}/unread-count`,
      { query: companyId ? { companyId } : undefined },
    ),
};
