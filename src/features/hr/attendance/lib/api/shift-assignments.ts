import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { ShiftAssignmentResponseDto, ShiftAssignmentListQuery, CreateShiftAssignmentDto, BulkCreateShiftAssignmentDto, BulkCreateShiftAssignmentResult, UpdateShiftAssignmentDto, GroupedByTemplateEmployee, GroupedByTemplateItem, GroupedByTemplateQuery, UnassignedEmployeeResponseDto, UnassignedEmployeesListQuery } from '@/features/hr/attendance/types/api/shift-assignments';
export type { ShiftAssignmentResponseDto, ShiftAssignmentListQuery, CreateShiftAssignmentDto, BulkCreateShiftAssignmentDto, BulkCreateShiftAssignmentResult, UpdateShiftAssignmentDto, GroupedByTemplateEmployee, GroupedByTemplateItem, GroupedByTemplateQuery, UnassignedEmployeeResponseDto, UnassignedEmployeesListQuery } from '@/features/hr/attendance/types/api/shift-assignments';










/** Active company employee with no effective shift assignment on the reference date. */


export const shiftAssignmentsApi = {
  getAll(query?: ShiftAssignmentListQuery) {
    return apiRequest<PaginatedResult<ShiftAssignmentResponseDto>>('/attendance/shift-assignments', { query });
  },
  getGroupedByTemplate(query?: GroupedByTemplateQuery) {
    return apiRequest<PaginatedResult<GroupedByTemplateItem>>('/attendance/shift-assignments/grouped-by-template', { query });
  },
  getUnassignedEmployees(query: UnassignedEmployeesListQuery) {
    return apiRequest<PaginatedResult<UnassignedEmployeeResponseDto>>(
      '/attendance/shift-assignments/unassigned-employees',
      { query },
    );
  },
  getById(id: string) {
    return apiRequest<ShiftAssignmentResponseDto>(`/attendance/shift-assignments/${id}`);
  },
  create(payload: CreateShiftAssignmentDto) {
    return apiRequest<ShiftAssignmentResponseDto>('/attendance/shift-assignments', { method: 'POST', body: payload });
  },
  bulkCreate(payload: BulkCreateShiftAssignmentDto) {
    return apiRequest<BulkCreateShiftAssignmentResult>('/attendance/shift-assignments/bulk', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateShiftAssignmentDto) {
    return apiRequest<ShiftAssignmentResponseDto>(`/attendance/shift-assignments/${id}`, { method: 'PATCH', body: payload });
  },
  remove(id: string) {
    return apiRequest<void>(`/attendance/shift-assignments/${id}`, { method: 'DELETE' });
  },
};

