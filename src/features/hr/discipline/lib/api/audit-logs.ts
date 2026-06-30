import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { AuditLogResponseDto, AuditLogsListQuery } from '@/features/hr/discipline/types/api/audit-logs';
export type { AuditLogResponseDto, AuditLogsListQuery } from '@/features/hr/discipline/types/api/audit-logs';



export const auditLogsApi = {
  getAll(query?: AuditLogsListQuery) {
    return apiRequest<PaginatedResult<AuditLogResponseDto>>('/audit-logs', { query });
  },
};

