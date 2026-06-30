import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { LeaveRequestStatus, LeaveRequestResponseDto, LeaveRequestListQuery, CreateLeaveRequestDto, UpdateLeaveRequestDto } from '@/features/hr/leaves/types/api/leave-requests';
export type { LeaveRequestStatus, LeaveRequestResponseDto, LeaveRequestListQuery, CreateLeaveRequestDto, UpdateLeaveRequestDto } from '@/features/hr/leaves/types/api/leave-requests';



/** Raw row from GET /requests/leave-requests */
type ApiLeaveRequestRow = {
  id: string;
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  status: LeaveRequestStatus;
  startDate: string;
  endDate: string;
  workingDays: number;
  reasonAr: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};




function mapLeaveRequestRow(row: ApiLeaveRequestRow): LeaveRequestResponseDto {
  return {
    id: row.id,
    companyId: row.companyId,
    employeeId: row.employeeId,
    leaveTypeId: row.leaveTypeId,
    employeeAssignmentId: null,
    status: row.status,
    startDate: row.startDate,
    endDate: row.endDate,
    workingDays: row.workingDays,
    noteAr: row.reasonAr,
    noteEn: null,
    approvalChain: null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

function mapLeaveRequestPage(
  result: PaginatedResult<ApiLeaveRequestRow>,
): PaginatedResult<LeaveRequestResponseDto> {
  return {
    items: result.items.map(mapLeaveRequestRow),
    pagination: result.pagination,
  };
}

export const leaveRequestsApi = {
  async getAll(query?: LeaveRequestListQuery) {
    const result = await apiRequest<PaginatedResult<ApiLeaveRequestRow>>('/requests/leave-requests', {
      query,
    });
    return mapLeaveRequestPage(result);
  },
  async getById(id: string) {
    const row = await apiRequest<ApiLeaveRequestRow>(`/requests/leave-requests/${id}`);
    return mapLeaveRequestRow(row);
  },
  async create(payload: CreateLeaveRequestDto) {
    const row = await apiRequest<ApiLeaveRequestRow>('/requests/leave-requests', {
      method: 'POST',
      body: {
        companyId: payload.companyId,
        employeeId: payload.employeeId,
        leaveTypeId: payload.leaveTypeId,
        startDate: payload.startDate ?? undefined,
        endDate: payload.endDate ?? undefined,
        workingDays: payload.workingDays ?? undefined,
        reasonAr: payload.noteAr ?? undefined,
      },
    });
    return mapLeaveRequestRow(row);
  },
  async update(id: string, payload: UpdateLeaveRequestDto) {
    const row = await apiRequest<ApiLeaveRequestRow>(`/requests/leave-requests/${id}`, {
      method: 'PATCH',
      body: {
        status: payload.status,
        startDate: payload.startDate ?? undefined,
        endDate: payload.endDate ?? undefined,
        workingDays: payload.workingDays ?? undefined,
        reasonAr: payload.noteAr ?? undefined,
      },
    });
    return mapLeaveRequestRow(row);
  },
  remove(id: string) {
    return apiRequest<void>(`/requests/leave-requests/${id}`, { method: 'DELETE' });
  },
};

