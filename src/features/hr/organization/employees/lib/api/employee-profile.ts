import { apiRequest } from '@/features/hr/lib/api/client';

export type AttendanceProfileSummaryDto = {
  rangeFrom: string;
  rangeTo: string;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateCount: number;
  overtimeHours: string;
  totalWorkHours: string;
  attendanceRate: string | null;
  totalLateMinutes: number;
  breakdownByStatus: {
    present: number;
    late: number;
    absent: number;
    restDay: number;
    holiday: number;
    onLeave: number;
    unscheduled: number;
  };
  rowsAnalyzed: number;
};

export type WorkflowRequestSummaryDto = {
  id: string;
  sourceTable: string;
  requestTypeId: string;
  requestTypeNameAr: string;
  requestTypeSlug: string;
  requestCategory: string | null;
  subtypeSlug: string | null;
  subtypeNameAr: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  title: string;
  submittedAt: string;
  decidedAt: string | null;
  cancelledAt: string | null;
};

export type WorkflowRequestsResponseDto = {
  counts?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  };
  countsByCategory?: Record<string, number>;
  /** Present when the API paginates server-side; omitted on the current profile endpoint. */
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  submittedRequests?: WorkflowRequestSummaryDto[];
  availableWorkflows: Array<{
    requestTypeId: string;
    slug: string;
    nameAr: string;
    nameEn: string | null;
    category: string | null;
    sortOrder: number;
    hasConcreteImpl: boolean;
    subtypeCount: number;
    isActive: boolean;
  }>;
};

export type AuditEntityScope =
  | 'employee'
  | 'assignment'
  | 'contract'
  | 'payroll'
  | 'leave'
  | 'attendance'
  | 'request'
  | 'violation'
  | 'advance'
  | 'other';

export type AuditChangeSummaryDto = {
  id: string;
  scope: AuditEntityScope;
  entityName: string;
  entityId: string | null;
  entityDisplayName: string | null;
  action: string;
  actionNameAr: string | null;
  severity: string | null;
  moduleCode: string;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  changedFields: string[];
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  description: string | null;
  reason: string | null;
  requestMethod: string | null;
  requestPath: string | null;
  requestId: string | null;
  ipAddress: string | null;
  occurredAt: string;
};

export type AuditActorSummaryDto = {
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  changeCount: number;
  lastOccurredAt: string;
};

export type AuditResponseDto = {
  counts: {
    total: number;
    byAction: Record<string, number>;
    byScope: Record<string, number>;
    byEntityName: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  topActors: AuditActorSummaryDto[];
  lastActivityAt: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  changes: AuditChangeSummaryDto[];
};

export type AuditQuery = {
  page?: number;
  pageSize?: number;
  scope?: AuditEntityScope;
  entityName?: string;
  action?: string;
  actorUserId?: string;
  from?: string;
  to?: string;
};

export const employeeProfileApi = {
  getAttendance(employeeId: string, query?: { from?: string; to?: string }) {
    return apiRequest<AttendanceProfileSummaryDto>(
      `/hr/employees/${employeeId}/profile/attendance`,
      { query },
    );
  },

  getRequests(
    employeeId: string,
    query?: { page?: number; pageSize?: number; status?: WorkflowRequestSummaryDto['status'] },
  ) {
    return apiRequest<WorkflowRequestsResponseDto>(
      `/hr/employees/${employeeId}/profile/requests`,
      { query },
    );
  },

  getAudit(employeeId: string, query?: AuditQuery) {
    return apiRequest<AuditResponseDto>(
      `/hr/employees/${employeeId}/profile/audit`,
      { query },
    );
  },
};
