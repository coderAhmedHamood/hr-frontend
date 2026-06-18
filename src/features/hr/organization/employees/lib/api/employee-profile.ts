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
  counts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  };
  countsByCategory: Record<string, number>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  submittedRequests: WorkflowRequestSummaryDto[];
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
};
