import {
  apiRequest,
  ensurePaginatedResult,
  type PaginatedResult,
} from '@/features/hr/lib/api/client';

export type MobileSerialApprovalStatus = 'pending' | 'approved' | 'rejected';

export type MobileSerialApproval = {
  id: string;
  companyId: string;
  userId: string;
  userFullNameAr?: string | null;
  userFullNameEn?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
  previousSerialNumber?: string | null;
  /** Alias some APIs may use instead of previousSerialNumber */
  currentSerialNumber?: string | null;
  requestedSerialNumber: string;
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
  page?: number;
  limit?: number;
  search?: string;
};

function listQuery(query: MobileSerialApprovalListQuery) {
  return {
    companyId: query.companyId || undefined,
    status: query.status && query.status !== 'all' ? query.status : undefined,
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
      throwOnError: true,
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
      throwOnError: true,
      body: {},
    });
  },

  async reject(id: string): Promise<MobileSerialApproval> {
    return apiRequest<MobileSerialApproval>(`/system/mobile-serial-approvals/${id}/reject`, {
      method: 'POST',
      throwOnError: true,
      body: {},
    });
  },
};
