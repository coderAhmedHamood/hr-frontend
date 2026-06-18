import {
  resolvePrimaryAssignment,
  sortAssignmentHistory,
} from '@/features/hr/organization/employees/services/employee-assignments.service';
import type { EnrichedEmployeeAssignment } from '@/features/hr/organization/employees/services/employee-assignments.service';
import type { EmployeeAssignmentResponseDto } from '@/features/hr/organization/employees/lib/api/employee-assignments';

function assignment(
  partial: Partial<EmployeeAssignmentResponseDto> & Pick<EmployeeAssignmentResponseDto, 'id' | 'companyId' | 'branchId'>,
): EmployeeAssignmentResponseDto {
  return {
    employeeId: 'emp-1',
    departmentId: null,
    jobTitleId: null,
    isPrimary: false,
    status: 'active',
    startDate: null,
    endDate: null,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    createdBy: null,
    updatedBy: null,
    ...partial,
  };
}

describe('resolvePrimaryAssignment', () => {
  it('prefers primary active assignment', () => {
    const list = [
      assignment({ id: 'a1', companyId: 'c1', branchId: 'b1', isPrimary: false }),
      assignment({ id: 'a2', companyId: 'c2', branchId: 'b2', isPrimary: true, status: 'active' }),
    ];
    expect(resolvePrimaryAssignment(list)?.id).toBe('a2');
  });

  it('falls back to first active assignment', () => {
    const list = [
      assignment({ id: 'a1', companyId: 'c1', branchId: 'b1', status: 'ended' }),
      assignment({ id: 'a2', companyId: 'c2', branchId: 'b2', status: 'active' }),
    ];
    expect(resolvePrimaryAssignment(list)?.id).toBe('a2');
  });

  it('returns null when list is empty', () => {
    expect(resolvePrimaryAssignment([])).toBeNull();
  });
});

function enriched(
  partial: Partial<EnrichedEmployeeAssignment> & Pick<EnrichedEmployeeAssignment, 'id'>,
): EnrichedEmployeeAssignment {
  return {
    employeeId: 'emp-1',
    companyId: 'c1',
    branchId: 'b1',
    departmentId: null,
    jobTitleId: null,
    isPrimary: false,
    status: 'active',
    startDate: '2024-01-01',
    endDate: null,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    createdBy: null,
    updatedBy: null,
    companyNameAr: 'شركة',
    branchNameAr: 'فرع',
    departmentNameAr: null,
    jobTitleNameAr: null,
    ...partial,
  };
}

describe('sortAssignmentHistory', () => {
  it('pins primary assignment first', () => {
    const sorted = sortAssignmentHistory([
      enriched({ id: 'a1', isPrimary: false, startDate: '2025-01-01' }),
      enriched({ id: 'a2', isPrimary: true, startDate: '2024-01-01' }),
    ]);
    expect(sorted[0]?.id).toBe('a2');
  });
});
