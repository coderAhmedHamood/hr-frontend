import {
  apiRequest,
  ensurePaginatedResult,
  type PaginatedResult,
} from '@/features/hr/lib/api/client';

export type MobileSerialApprovalStatus = 'pending' | 'approved' | 'rejected';

/** Device auth channel for approval requests. */
export type DeviceLoginChannel = 'app' | 'web';

export type MobileSerialApproval = {
  id: string;
  companyId: string;
  userId: string;
  loginChannel?: DeviceLoginChannel | 'mobile' | string | null;
  userFullNameAr?: string | null;
  userFullNameEn?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
  /** الرقم السابق المرتبط بالقناة */
  previousSerialNumber?: string | null;
  /** Alias — نفس previousSerialNumber */
  oldMobileSerialNumber?: string | null;
  /** @deprecated استخدم previousSerialNumber / oldMobileSerialNumber */
  currentSerialNumber?: string | null;
  /** الرقم الجديد المطلوب تفعيله */
  pendingSerialNumber?: string | null;
  /** Alias — نفس pendingSerialNumber */
  newMobileSerialNumber?: string | null;
  /** @deprecated استخدم pendingSerialNumber / newMobileSerialNumber */
  requestedSerialNumber?: string | null;
  status: MobileSerialApprovalStatus;
  createdAt: string;
  updatedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  reviewedBy?: string | null;
};

export type MobileSerialApprovalListQuery = {
  companyId?: string;
  status?: MobileSerialApprovalStatus | 'all';
  /** Filter by channel: `app` | `web` */
  loginChannel?: DeviceLoginChannel | 'all';
  page?: number;
  limit?: number;
  search?: string;
};

function listQuery(query: MobileSerialApprovalListQuery) {
  return {
    companyId: query.companyId || undefined,
    status: query.status && query.status !== 'all' ? query.status : undefined,
    loginChannel:
      query.loginChannel && query.loginChannel !== 'all' ? query.loginChannel : undefined,
    page: query.page ?? 1,
    limit: query.limit ?? 50,
    search: query.search?.trim() || undefined,
  };
}

/** Admin — `/system/mobile-serial-approvals` (`system.users.read` / `update`). */
export const mobileSerialApprovalsApi = {
  async list(
    query: MobileSerialApprovalListQuery = {},
  ): Promise<PaginatedResult<MobileSerialApproval>> {
    const result = await apiRequest<
      PaginatedResult<MobileSerialApproval> | MobileSerialApproval[]
    >('/system/mobile-serial-approvals', {
      query: listQuery(query),
    });
    if (Array.isArray(result)) {
      return {
        items: result,
        pagination: {
          page: 1,
          limit: result.length,
          total: result.length,
          totalPages: 1,
        },
      };
    }
    return ensurePaginatedResult(result);
  },

  async approve(id: string): Promise<MobileSerialApproval> {
    return apiRequest<MobileSerialApproval>(`/system/mobile-serial-approvals/${id}/approve`, {
      method: 'POST',
      body: {},
    });
  },

  async reject(id: string): Promise<MobileSerialApproval> {
    return apiRequest<MobileSerialApproval>(`/system/mobile-serial-approvals/${id}/reject`, {
      method: 'POST',
      body: {},
    });
  },
};

export function normalizeLoginChannel(
  channel: MobileSerialApproval['loginChannel'],
): DeviceLoginChannel | null {
  if (channel === 'web') return 'web';
  if (channel === 'app' || channel === 'mobile') return 'app';
  return null;
}

export const LOGIN_CHANNEL_LABELS_AR: Record<DeviceLoginChannel, string> = {
  app: 'تطبيق',
  web: 'موقع',
};

/** الرقم السابق (قديم) — يعمل لتطبيق وموقع. */
export function resolvePreviousSerial(row: MobileSerialApproval): string {
  return (
    row.previousSerialNumber?.trim() ||
    row.oldMobileSerialNumber?.trim() ||
    row.currentSerialNumber?.trim() ||
    ''
  );
}

/** الرقم الجديد المطلوب تفعيله — يعمل لتطبيق وموقع. */
export function resolvePendingSerial(row: MobileSerialApproval): string {
  return (
    row.pendingSerialNumber?.trim() ||
    row.newMobileSerialNumber?.trim() ||
    row.requestedSerialNumber?.trim() ||
    ''
  );
}
