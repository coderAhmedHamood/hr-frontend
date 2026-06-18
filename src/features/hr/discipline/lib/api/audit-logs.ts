import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type AuditLogResponseDto = {
  id: string;
  companyId: string | null;
  moduleCode: string;
  entityName: string;
  entityId: string | null;
  entityDisplayName: string | null;
  action: string;
  actionNameAr: string | null;
  severity: string | null;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  description: string | null;
  reason: string | null;
  occurredAt: string;
  createdAt: string;
};

export type AuditLogsListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  moduleCode?: string;
  entityName?: string;
  entityNameContains?: string;
  action?: string;
  occurredFrom?: string;
  occurredTo?: string;
  search?: string;
};

export const auditLogsApi = {
  getAll(query?: AuditLogsListQuery) {
    return apiRequest<PaginatedResult<AuditLogResponseDto>>('/audit-logs', { query });
  },
};
